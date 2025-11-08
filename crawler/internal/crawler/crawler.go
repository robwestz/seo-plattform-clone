package crawler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"time"

	"go.uber.org/zap"
)

// Crawler represents the main crawler engine
type Crawler struct {
	httpClient  *HTTPClient
	rateLimiter *DomainRateLimiter
	robotsCache *RobotsCache
	sitemap     *SitemapParser
	logger      *zap.Logger
	config      CrawlerConfig
}

// CrawlerConfig holds crawler configuration
type CrawlerConfig struct {
	UserAgent        string
	RespectRobots    bool
	MaxDepth         int
	MaxConcurrency   int
	RequestTimeout   time.Duration
	RateLimitPerSec  float64
	FollowRedirects  bool
	JavaScriptEnabled bool
}

// NewCrawler creates a new crawler instance
func NewCrawler(config CrawlerConfig, logger *zap.Logger) *Crawler {
	if config.UserAgent == "" {
		config.UserAgent = "SEO-Intelligence-Bot/1.0 (+https://seo-platform.com/bot)"
	}
	if config.MaxDepth == 0 {
		config.MaxDepth = 5
	}
	if config.MaxConcurrency == 0 {
		config.MaxConcurrency = 10
	}
	if config.RequestTimeout == 0 {
		config.RequestTimeout = 30 * time.Second
	}
	if config.RateLimitPerSec == 0 {
		config.RateLimitPerSec = 1.0
	}

	httpClient := NewHTTPClient(ClientConfig{
		Timeout:        config.RequestTimeout,
		MaxRetries:     3,
		RetryDelay:     1 * time.Second,
		UserAgent:      config.UserAgent,
		FollowRedirect: config.FollowRedirects,
	}, logger)

	rateLimiter := NewDomainRateLimiter(RateLimiterConfig{
		DefaultRate:  float64(config.RateLimitPerSec),
		DefaultBurst: 3,
	})

	robotsCache := NewRobotsCache(httpClient, logger, 24*time.Hour)
	sitemapParser := NewSitemapParser(httpClient, logger)

	return &Crawler{
		httpClient:  httpClient,
		rateLimiter: rateLimiter,
		robotsCache: robotsCache,
		sitemap:     sitemapParser,
		logger:      logger,
		config:      config,
	}
}

// CrawlResult represents the result of crawling a single URL
type CrawlResult struct {
	URL           string
	FinalURL      string
	StatusCode    int
	ContentType   string
	Content       []byte
	ContentHash   string
	Links         []string
	Title         string
	MetaTags      map[string]string
	Headers       map[string][]string
	CrawledAt     time.Time
	Duration      time.Duration
	Depth         int
	Error         error
}

// Crawl fetches and processes a single URL
func (c *Crawler) Crawl(ctx context.Context, targetURL string, depth int) (*CrawlResult, error) {
	startTime := time.Now()

	c.logger.Info("crawling URL",
		zap.String("url", targetURL),
		zap.Int("depth", depth),
	)

	// Parse URL to extract domain
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	domain := parsedURL.Host

	// Check robots.txt if enabled
	if c.config.RespectRobots {
		allowed, err := c.robotsCache.IsAllowed(ctx, targetURL, c.config.UserAgent)
		if err != nil {
			c.logger.Warn("failed to check robots.txt",
				zap.String("url", targetURL),
				zap.Error(err),
			)
		} else if !allowed {
			c.logger.Info("URL disallowed by robots.txt",
				zap.String("url", targetURL),
			)
			return &CrawlResult{
				URL:       targetURL,
				Error:     fmt.Errorf("disallowed by robots.txt"),
				CrawledAt: time.Now(),
			}, nil
		}

		// Get and apply crawl delay
		crawlDelay, err := c.robotsCache.GetCrawlDelay(ctx, targetURL, c.config.UserAgent)
		if err == nil && crawlDelay > 0 {
			c.rateLimiter.SetCrawlDelay(domain, crawlDelay)
		}
	}

	// Apply rate limiting
	if err := c.rateLimiter.Wait(ctx, domain); err != nil {
		return nil, fmt.Errorf("rate limiter error: %w", err)
	}

	// Fetch the page
	resp, err := c.httpClient.Fetch(ctx, targetURL)
	if err != nil {
		return &CrawlResult{
			URL:       targetURL,
			Error:     err,
			CrawledAt: time.Now(),
			Duration:  time.Since(startTime),
		}, err
	}

	// Calculate content hash
	contentHash := calculateHash(resp.Body)

	// Convert headers to map
	headers := make(map[string][]string)
	for key, values := range resp.Headers {
		headers[key] = values
	}

	result := &CrawlResult{
		URL:         targetURL,
		FinalURL:    resp.FinalURL,
		StatusCode:  resp.StatusCode,
		ContentType: resp.ContentType,
		Content:     resp.Body,
		ContentHash: contentHash,
		Headers:     headers,
		CrawledAt:   time.Now(),
		Duration:    resp.Duration,
		Depth:       depth,
	}

	c.logger.Info("crawl completed",
		zap.String("url", targetURL),
		zap.Int("status", resp.StatusCode),
		zap.String("hash", contentHash),
		zap.Duration("duration", resp.Duration),
	)

	return result, nil
}

// CrawlWithRetry crawls a URL with retry logic
func (c *Crawler) CrawlWithRetry(ctx context.Context, targetURL string, depth int, maxRetries int) (*CrawlResult, error) {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			delay := time.Duration(1<<uint(attempt-1)) * time.Second
			c.logger.Info("retrying crawl",
				zap.String("url", targetURL),
				zap.Int("attempt", attempt),
				zap.Duration("delay", delay),
			)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}

		result, err := c.Crawl(ctx, targetURL, depth)
		if err == nil {
			return result, nil
		}

		lastErr = err
	}

	return nil, fmt.Errorf("failed after %d attempts: %w", maxRetries+1, lastErr)
}

// GetSitemaps retrieves sitemap URLs for a domain
func (c *Crawler) GetSitemaps(ctx context.Context, baseURL string) ([]string, error) {
	return c.robotsCache.GetSitemaps(ctx, baseURL)
}

// ParseSitemap parses a sitemap and returns URLs
func (c *Crawler) ParseSitemap(ctx context.Context, sitemapURL string) ([]SitemapURL, error) {
	return c.sitemap.ParseRecursive(ctx, sitemapURL, 3)
}

// calculateHash calculates SHA256 hash of content
func calculateHash(content []byte) string {
	hash := sha256.Sum256(content)
	return hex.EncodeToString(hash[:])
}

// IsHTMLContent checks if content type is HTML
func IsHTMLContent(contentType string) bool {
	return contentType != "" &&
		(contentType == "text/html" ||
		 contentType[:9] == "text/html")
}
