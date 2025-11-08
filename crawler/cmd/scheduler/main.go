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
	"github.com/seo-platform/crawler/internal/queue"
	"github.com/seo-platform/crawler/internal/storage"
	"go.uber.org/zap"
)

type SchedulerService struct {
	crawler    *crawler.Crawler
	postgres   *storage.PostgresStorage
	kafkaQueue *queue.KafkaQueue
	logger     *zap.Logger
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

	logger.Info("starting scheduler service")

	// Initialize storage
	postgresURL := getEnv("POSTGRES_URL", "postgres://postgres:password@localhost:5432/seo_platform")
	pg, err := storage.NewPostgresStorage(postgresURL, logger)
	if err != nil {
		logger.Fatal("failed to connect to PostgreSQL", zap.Error(err))
	}
	defer pg.Close()

	// Initialize Kafka queue
	kafkaBrokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")
	kafkaTopic := getEnv("KAFKA_TOPIC", "crawl-jobs")

	kq := queue.NewKafkaQueue(queue.KafkaConfig{
		Brokers:      kafkaBrokers,
		Topic:        kafkaTopic,
		BatchSize:    100,
		BatchTimeout: 1 * time.Second,
	}, logger)
	defer kq.Close()

	// Initialize crawler (for sitemap discovery)
	crawlerConfig := crawler.CrawlerConfig{
		UserAgent:       getEnv("USER_AGENT", "SEO-Intelligence-Bot/1.0"),
		RespectRobots:   true,
		MaxDepth:        5,
		RequestTimeout:  30 * time.Second,
		RateLimitPerSec: 1.0,
	}

	c := crawler.NewCrawler(crawlerConfig, logger)

	service := &SchedulerService{
		crawler:    c,
		postgres:   pg,
		kafkaQueue: kq,
		logger:     logger,
	}

	// Start HTTP server
	go service.startHTTPServer()

	// Start periodic scheduler
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go service.runScheduler(ctx)

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	logger.Info("shutting down scheduler service")
	cancel()
	time.Sleep(2 * time.Second)
}

func (s *SchedulerService) startHTTPServer() {
	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Schedule domain crawl
	router.POST("/schedule/domain", s.handleScheduleDomain)

	// Schedule sitemap crawl
	router.POST("/schedule/sitemap", s.handleScheduleSitemap)

	// Bulk schedule from file
	router.POST("/schedule/bulk", s.handleScheduleBulk)

	port := getEnv("PORT", "8081")
	s.logger.Info("starting HTTP server", zap.String("port", port))

	if err := router.Run(":" + port); err != nil {
		s.logger.Fatal("failed to start HTTP server", zap.Error(err))
	}
}

func (s *SchedulerService) handleScheduleDomain(c *gin.Context) {
	var req struct {
		Domain   string `json:"domain" binding:"required"`
		MaxDepth int    `json:"max_depth"`
		Priority int    `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure domain has protocol
	domain := req.Domain
	if !strings.HasPrefix(domain, "http") {
		domain = "https://" + domain
	}

	if req.MaxDepth == 0 {
		req.MaxDepth = 3
	}

	// Try to get sitemaps from robots.txt
	sitemaps, err := s.crawler.GetSitemaps(c.Request.Context(), domain)
	if err != nil {
		s.logger.Warn("failed to get sitemaps", zap.Error(err))
	}

	var jobIDs []int64

	// Schedule sitemap crawls if available
	if len(sitemaps) > 0 {
		for _, sitemapURL := range sitemaps {
			jobID, err := s.scheduleSitemapCrawl(c.Request.Context(), sitemapURL, req.MaxDepth, req.Priority)
			if err != nil {
				s.logger.Error("failed to schedule sitemap", zap.Error(err))
				continue
			}
			jobIDs = append(jobIDs, jobID)
		}
	} else {
		// Schedule homepage crawl as fallback
		jobID, err := s.scheduleURLCrawl(c.Request.Context(), domain, req.MaxDepth, req.Priority)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to schedule crawl"})
			return
		}
		jobIDs = append(jobIDs, jobID)
	}

	c.JSON(http.StatusCreated, gin.H{
		"domain":  req.Domain,
		"job_ids": jobIDs,
		"status":  "scheduled",
	})
}

func (s *SchedulerService) handleScheduleSitemap(c *gin.Context) {
	var req struct {
		SitemapURL string `json:"sitemap_url" binding:"required"`
		MaxDepth   int    `json:"max_depth"`
		Priority   int    `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.MaxDepth == 0 {
		req.MaxDepth = 2
	}

	jobID, err := s.scheduleSitemapCrawl(c.Request.Context(), req.SitemapURL, req.MaxDepth, req.Priority)
	if err != nil {
		s.logger.Error("failed to schedule sitemap crawl", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to schedule sitemap crawl"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"sitemap_url": req.SitemapURL,
		"job_id":      jobID,
		"status":      "scheduled",
	})
}

func (s *SchedulerService) handleScheduleBulk(c *gin.Context) {
	var req struct {
		URLs     []string `json:"urls" binding:"required"`
		MaxDepth int      `json:"max_depth"`
		Priority int      `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.MaxDepth == 0 {
		req.MaxDepth = 2
	}

	var jobIDs []int64
	var errors []string

	for _, urlStr := range req.URLs {
		jobID, err := s.scheduleURLCrawl(c.Request.Context(), urlStr, req.MaxDepth, req.Priority)
		if err != nil {
			s.logger.Error("failed to schedule URL",
				zap.String("url", urlStr),
				zap.Error(err),
			)
			errors = append(errors, fmt.Sprintf("%s: %v", urlStr, err))
			continue
		}
		jobIDs = append(jobIDs, jobID)
	}

	response := gin.H{
		"scheduled": len(jobIDs),
		"job_ids":   jobIDs,
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	c.JSON(http.StatusCreated, response)
}

func (s *SchedulerService) scheduleURLCrawl(ctx context.Context, urlStr string, maxDepth, priority int) (int64, error) {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return 0, fmt.Errorf("invalid URL: %w", err)
	}

	// Create crawl job in database
	job := &storage.CrawlJob{
		URL:      urlStr,
		Domain:   parsedURL.Host,
		Status:   "pending",
		Priority: priority,
		Depth:    0,
		MaxDepth: maxDepth,
	}

	jobID, err := s.postgres.CreateCrawlJob(ctx, job)
	if err != nil {
		return 0, fmt.Errorf("failed to create crawl job: %w", err)
	}

	// Publish to Kafka
	msg := &queue.CrawlMessage{
		JobID:    jobID,
		URL:      urlStr,
		Depth:    0,
		MaxDepth: maxDepth,
		Priority: priority,
	}

	if err := s.kafkaQueue.PublishCrawlJob(ctx, msg); err != nil {
		return 0, fmt.Errorf("failed to publish crawl job: %w", err)
	}

	s.logger.Info("scheduled URL crawl",
		zap.Int64("job_id", jobID),
		zap.String("url", urlStr),
	)

	return jobID, nil
}

func (s *SchedulerService) scheduleSitemapCrawl(ctx context.Context, sitemapURL string, maxDepth, priority int) (int64, error) {
	s.logger.Info("parsing sitemap", zap.String("url", sitemapURL))

	urls, err := s.crawler.ParseSitemap(ctx, sitemapURL)
	if err != nil {
		return 0, fmt.Errorf("failed to parse sitemap: %w", err)
	}

	s.logger.Info("parsed sitemap",
		zap.String("url", sitemapURL),
		zap.Int("urls", len(urls)),
	)

	// Create a parent job for the sitemap
	parsedURL, _ := url.Parse(sitemapURL)
	parentJob := &storage.CrawlJob{
		URL:      sitemapURL,
		Domain:   parsedURL.Host,
		Status:   "pending",
		Priority: priority,
		Depth:    0,
		MaxDepth: maxDepth,
	}

	parentJobID, err := s.postgres.CreateCrawlJob(ctx, parentJob)
	if err != nil {
		return 0, fmt.Errorf("failed to create parent job: %w", err)
	}

	// Create messages for all URLs
	var messages []*queue.CrawlMessage
	for _, sitemapURL := range urls {
		messages = append(messages, &queue.CrawlMessage{
			URL:      sitemapURL.Loc,
			Depth:    0,
			MaxDepth: maxDepth,
			Priority: priority,
			Metadata: map[string]string{
				"sitemap":        sitemapURL,
				"parent_job_id": fmt.Sprintf("%d", parentJobID),
			},
		})
	}

	// Publish in batches
	batchSize := 100
	for i := 0; i < len(messages); i += batchSize {
		end := i + batchSize
		if end > len(messages) {
			end = len(messages)
		}

		batch := messages[i:end]
		if err := s.kafkaQueue.PublishCrawlJobBatch(ctx, batch); err != nil {
			s.logger.Error("failed to publish batch",
				zap.Error(err),
				zap.Int("batch", i/batchSize),
			)
			continue
		}
	}

	s.logger.Info("scheduled sitemap crawl",
		zap.Int64("parent_job_id", parentJobID),
		zap.String("sitemap", sitemapURL),
		zap.Int("urls", len(messages)),
	)

	return parentJobID, nil
}

func (s *SchedulerService) runScheduler(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	s.logger.Info("started periodic scheduler")

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("stopping scheduler")
			return
		case <-ticker.C:
			s.logger.Info("running periodic tasks")
			// Add periodic tasks here (e.g., re-crawl old pages)
		}
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
