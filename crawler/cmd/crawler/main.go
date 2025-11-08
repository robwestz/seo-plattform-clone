package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/seo-platform/crawler/internal/crawler"
	"github.com/seo-platform/crawler/internal/parser"
	"github.com/seo-platform/crawler/internal/queue"
	"github.com/seo-platform/crawler/internal/storage"
	"github.com/seo-platform/crawler/pkg/bloom"
	"go.uber.org/zap"
)

type CrawlerService struct {
	crawler      *crawler.Crawler
	htmlParser   *parser.HTMLParser
	linkExtractor *parser.LinkExtractor
	postgres     *storage.PostgresStorage
	mongo        *storage.MongoStorage
	kafkaQueue   *queue.KafkaQueue
	deduplicator *bloom.URLDeduplicator
	logger       *zap.Logger
}

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("failed to create logger: %v", err))
	}
	defer logger.Sync()

	logger.Info("starting crawler service")

	// Initialize storage
	postgresURL := getEnv("POSTGRES_URL", "postgres://postgres:password@localhost:5432/seo_platform")
	pg, err := storage.NewPostgresStorage(postgresURL, logger)
	if err != nil {
		logger.Fatal("failed to connect to PostgreSQL", zap.Error(err))
	}
	defer pg.Close()

	mongoURL := getEnv("MONGO_URL", "mongodb://localhost:27017")
	mongoDb := getEnv("MONGO_DATABASE", "seo_crawler")
	mg, err := storage.NewMongoStorage(mongoURL, mongoDb, logger)
	if err != nil {
		logger.Fatal("failed to connect to MongoDB", zap.Error(err))
	}
	defer mg.Close(context.Background())

	// Initialize Kafka queue
	kafkaBrokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")
	kafkaTopic := getEnv("KAFKA_TOPIC", "crawl-jobs")
	kafkaGroup := getEnv("KAFKA_CONSUMER_GROUP", "crawler-workers")

	kq := queue.NewKafkaQueue(queue.KafkaConfig{
		Brokers:       kafkaBrokers,
		Topic:         kafkaTopic,
		ConsumerGroup: kafkaGroup,
		BatchSize:     100,
		BatchTimeout:  1 * time.Second,
	}, logger)
	defer kq.Close()

	// Initialize crawler
	crawlerConfig := crawler.CrawlerConfig{
		UserAgent:        getEnv("USER_AGENT", "SEO-Intelligence-Bot/1.0"),
		RespectRobots:    getEnv("RESPECT_ROBOTS", "true") == "true",
		MaxDepth:         5,
		MaxConcurrency:   10,
		RequestTimeout:   30 * time.Second,
		RateLimitPerSec:  1.0,
		FollowRedirects:  true,
	}

	c := crawler.NewCrawler(crawlerConfig, logger)

	// Initialize parsers
	htmlParser := parser.NewHTMLParser(logger)
	linkExtractor := parser.NewLinkExtractor(logger)

	// Initialize URL deduplicator
	dedup := bloom.NewURLDeduplicator(1000000, 0.01, logger)

	service := &CrawlerService{
		crawler:       c,
		htmlParser:    htmlParser,
		linkExtractor: linkExtractor,
		postgres:      pg,
		mongo:         mg,
		kafkaQueue:    kq,
		deduplicator:  dedup,
		logger:        logger,
	}

	// Start HTTP server for API
	go service.startHTTPServer()

	// Start Kafka consumer
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := service.consumeJobs(ctx); err != nil {
			logger.Error("consumer error", zap.Error(err))
		}
	}()

	<-sigChan
	logger.Info("shutting down crawler service")
	cancel()
	time.Sleep(2 * time.Second)
}

func (s *CrawlerService) startHTTPServer() {
	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Start crawl job
	router.POST("/crawl", s.handleStartCrawl)

	// Get crawl job status
	router.GET("/crawl/:id/status", s.handleGetCrawlStatus)

	// Get robots.txt info
	router.GET("/robots", s.handleGetRobots)

	// Get sitemap
	router.GET("/sitemap", s.handleGetSitemap)

	// Stats
	router.GET("/stats", s.handleGetStats)

	port := getEnv("PORT", "8080")
	s.logger.Info("starting HTTP server", zap.String("port", port))

	if err := router.Run(":" + port); err != nil {
		s.logger.Fatal("failed to start HTTP server", zap.Error(err))
	}
}

func (s *CrawlerService) handleStartCrawl(c *gin.Context) {
	var req struct {
		URL      string `json:"url" binding:"required"`
		MaxDepth int    `json:"max_depth"`
		Priority int    `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse URL
	parsedURL, err := url.Parse(req.URL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid URL"})
		return
	}

	if req.MaxDepth == 0 {
		req.MaxDepth = 3
	}

	// Create crawl job in database
	job := &storage.CrawlJob{
		URL:      req.URL,
		Domain:   parsedURL.Host,
		Status:   "pending",
		Priority: req.Priority,
		Depth:    0,
		MaxDepth: req.MaxDepth,
	}

	jobID, err := s.postgres.CreateCrawlJob(c.Request.Context(), job)
	if err != nil {
		s.logger.Error("failed to create crawl job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create job"})
		return
	}

	// Publish to Kafka
	msg := &queue.CrawlMessage{
		JobID:    jobID,
		URL:      req.URL,
		Depth:    0,
		MaxDepth: req.MaxDepth,
		Priority: req.Priority,
	}

	if err := s.kafkaQueue.PublishCrawlJob(c.Request.Context(), msg); err != nil {
		s.logger.Error("failed to publish crawl job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to queue job"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"job_id": jobID,
		"url":    req.URL,
		"status": "queued",
	})
}

func (s *CrawlerService) handleGetCrawlStatus(c *gin.Context) {
	jobID := c.Param("id")

	var id int64
	if _, err := fmt.Sscanf(jobID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job ID"})
		return
	}

	job, err := s.postgres.GetCrawlJob(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (s *CrawlerService) handleGetRobots(c *gin.Context) {
	domain := c.Query("domain")
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "domain parameter required"})
		return
	}

	// Ensure full URL
	if !strings.HasPrefix(domain, "http") {
		domain = "https://" + domain
	}

	sitemaps, err := s.crawler.GetSitemaps(c.Request.Context(), domain)
	if err != nil {
		s.logger.Error("failed to get sitemaps", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get robots.txt"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"domain":   domain,
		"sitemaps": sitemaps,
	})
}

func (s *CrawlerService) handleGetSitemap(c *gin.Context) {
	sitemapURL := c.Query("url")
	if sitemapURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url parameter required"})
		return
	}

	urls, err := s.crawler.ParseSitemap(c.Request.Context(), sitemapURL)
	if err != nil {
		s.logger.Error("failed to parse sitemap", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse sitemap"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sitemap": sitemapURL,
		"count":   len(urls),
		"urls":    urls,
	})
}

func (s *CrawlerService) handleGetStats(c *gin.Context) {
	dedupStats := s.deduplicator.Stats()
	kafkaStats := s.kafkaQueue.Stats()

	c.JSON(http.StatusOK, gin.H{
		"deduplicator": dedupStats,
		"kafka": gin.H{
			"writes": kafkaStats.Writes,
			"messages": kafkaStats.Messages,
			"errors": kafkaStats.Errors,
		},
	})
}

func (s *CrawlerService) consumeJobs(ctx context.Context) error {
	return s.kafkaQueue.ConsumeCrawlJobs(ctx, func(msg *queue.CrawlMessage) error {
		return s.processCrawlJob(ctx, msg)
	})
}

func (s *CrawlerService) processCrawlJob(ctx context.Context, msg *queue.CrawlMessage) error {
	s.logger.Info("processing crawl job",
		zap.Int64("job_id", msg.JobID),
		zap.String("url", msg.URL),
		zap.Int("depth", msg.Depth),
	)

	// Check if already crawled
	if s.deduplicator.IsSeen(msg.URL) {
		s.logger.Info("URL already crawled, skipping", zap.String("url", msg.URL))
		return nil
	}

	// Update job status
	if err := s.postgres.UpdateCrawlJobStatus(ctx, msg.JobID, "processing", nil); err != nil {
		s.logger.Error("failed to update job status", zap.Error(err))
	}

	// Crawl the URL
	result, err := s.crawler.Crawl(ctx, msg.URL, msg.Depth)
	if err != nil {
		s.logger.Error("crawl failed", zap.Error(err), zap.String("url", msg.URL))
		errMsg := err.Error()
		_ = s.postgres.UpdateCrawlJobStatus(ctx, msg.JobID, "failed", &errMsg)
		return err
	}

	// Mark as seen
	s.deduplicator.MarkSeen(msg.URL)

	// Parse HTML if applicable
	if result.StatusCode == 200 && crawler.IsHTMLContent(result.ContentType) {
		if err := s.processHTMLPage(ctx, result, msg); err != nil {
			s.logger.Error("failed to process HTML", zap.Error(err))
		}
	}

	// Update job status
	if err := s.postgres.UpdateCrawlJobStatus(ctx, msg.JobID, "completed", nil); err != nil {
		s.logger.Error("failed to update job status", zap.Error(err))
	}

	s.logger.Info("completed crawl job",
		zap.Int64("job_id", msg.JobID),
		zap.String("url", msg.URL),
	)

	return nil
}

func (s *CrawlerService) processHTMLPage(ctx context.Context, result *crawler.CrawlResult, msg *queue.CrawlMessage) error {
	// Parse HTML
	parsed, err := s.htmlParser.Parse(result.Content, result.URL)
	if err != nil {
		return fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract links
	extracted := s.linkExtractor.Extract(parsed.Links, result.URL)

	// Count internal/external links
	internalCount := 0
	externalCount := 0
	for _, link := range extracted {
		if link.Type == parser.LinkTypeInternal {
			internalCount++
		} else if link.Type == parser.LinkTypeExternal {
			externalCount++
		}
	}

	// Save page metadata to PostgreSQL
	metadata := &storage.PageMetadata{
		URL:           result.URL,
		FinalURL:      result.FinalURL,
		Domain:        extractDomain(result.URL),
		StatusCode:    result.StatusCode,
		ContentType:   result.ContentType,
		ContentHash:   result.ContentHash,
		Title:         parsed.Title,
		Description:   parsed.Description,
		Keywords:      parsed.Keywords,
		CanonicalURL:  parsed.CanonicalURL,
		Language:      parsed.Language,
		H1Count:       len(parsed.Headings.H1),
		H2Count:       len(parsed.Headings.H2),
		ImageCount:    len(parsed.Images),
		LinkCount:     len(parsed.Links),
		InternalLinks: internalCount,
		ExternalLinks: externalCount,
		LoadTime:      int(result.Duration.Milliseconds()),
		CrawledAt:     result.CrawledAt,
	}

	if err := s.postgres.SavePageMetadata(ctx, metadata); err != nil {
		return fmt.Errorf("failed to save metadata: %w", err)
	}

	// Save raw HTML to MongoDB
	content := &storage.PageContent{
		URL:         result.URL,
		FinalURL:    result.FinalURL,
		ContentHash: result.ContentHash,
		HTML:        string(result.Content),
		Headers:     result.Headers,
		CrawledAt:   result.CrawledAt,
	}

	if err := s.mongo.SavePageContent(ctx, content); err != nil {
		return fmt.Errorf("failed to save content: %w", err)
	}

	// Queue child URLs if within depth limit
	if msg.Depth < msg.MaxDepth {
		s.queueChildURLs(ctx, extracted, msg)
	}

	return nil
}

func (s *CrawlerService) queueChildURLs(ctx context.Context, links []parser.ExtractedLink, parentMsg *queue.CrawlMessage) {
	internal := s.linkExtractor.FilterInternalLinks(links)
	follow := s.linkExtractor.FilterFollowLinks(internal)
	unique := s.linkExtractor.DeduplicateLinks(follow)

	var messages []*queue.CrawlMessage
	for _, link := range unique {
		if s.deduplicator.IsSeen(link.URL) {
			continue
		}

		messages = append(messages, &queue.CrawlMessage{
			URL:      link.URL,
			Depth:    parentMsg.Depth + 1,
			MaxDepth: parentMsg.MaxDepth,
			Priority: parentMsg.Priority,
		})
	}

	if len(messages) > 0 {
		if err := s.kafkaQueue.PublishCrawlJobBatch(ctx, messages); err != nil {
			s.logger.Error("failed to queue child URLs", zap.Error(err))
		} else {
			s.logger.Info("queued child URLs", zap.Int("count", len(messages)))
		}
	}
}

func extractDomain(urlStr string) string {
	parsed, err := url.Parse(urlStr)
	if err != nil {
		return ""
	}
	return parsed.Host
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
