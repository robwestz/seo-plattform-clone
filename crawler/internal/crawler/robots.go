package crawler

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/temoto/robotstxt"
	"go.uber.org/zap"
)

// RobotsCache caches robots.txt data for domains
type RobotsCache struct {
	cache  map[string]*robotsCacheEntry
	mu     sync.RWMutex
	client *HTTPClient
	logger *zap.Logger
	ttl    time.Duration
}

type robotsCacheEntry struct {
	robots    *robotstxt.RobotsData
	crawlDelay time.Duration
	sitemaps  []string
	fetchedAt time.Time
}

// NewRobotsCache creates a new robots.txt cache
func NewRobotsCache(client *HTTPClient, logger *zap.Logger, ttl time.Duration) *RobotsCache {
	if ttl == 0 {
		ttl = 24 * time.Hour
	}

	rc := &RobotsCache{
		cache:  make(map[string]*robotsCacheEntry),
		client: client,
		logger: logger,
		ttl:    ttl,
	}

	// Start cleanup goroutine
	go rc.cleanup()

	return rc
}

// IsAllowed checks if crawling a URL is allowed by robots.txt
func (rc *RobotsCache) IsAllowed(ctx context.Context, targetURL, userAgent string) (bool, error) {
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return false, fmt.Errorf("invalid URL: %w", err)
	}

	domain := parsedURL.Scheme + "://" + parsedURL.Host
	robotsURL := domain + "/robots.txt"

	entry, err := rc.getOrFetch(ctx, robotsURL, domain)
	if err != nil {
		// If robots.txt cannot be fetched, assume allowed (fail open)
		rc.logger.Warn("failed to fetch robots.txt, assuming allowed",
			zap.String("url", robotsURL),
			zap.Error(err),
		)
		return true, nil
	}

	if entry.robots == nil {
		return true, nil
	}

	allowed := entry.robots.TestAgent(parsedURL.Path, userAgent)
	return allowed, nil
}

// GetCrawlDelay returns the crawl delay for a domain
func (rc *RobotsCache) GetCrawlDelay(ctx context.Context, targetURL, userAgent string) (time.Duration, error) {
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return 0, fmt.Errorf("invalid URL: %w", err)
	}

	domain := parsedURL.Scheme + "://" + parsedURL.Host
	robotsURL := domain + "/robots.txt"

	entry, err := rc.getOrFetch(ctx, robotsURL, domain)
	if err != nil {
		return 0, err
	}

	return entry.crawlDelay, nil
}

// GetSitemaps returns sitemap URLs from robots.txt
func (rc *RobotsCache) GetSitemaps(ctx context.Context, targetURL string) ([]string, error) {
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	domain := parsedURL.Scheme + "://" + parsedURL.Host
	robotsURL := domain + "/robots.txt"

	entry, err := rc.getOrFetch(ctx, robotsURL, domain)
	if err != nil {
		return nil, err
	}

	return entry.sitemaps, nil
}

// getOrFetch retrieves robots.txt from cache or fetches it
func (rc *RobotsCache) getOrFetch(ctx context.Context, robotsURL, domain string) (*robotsCacheEntry, error) {
	// Check cache first
	rc.mu.RLock()
	entry, exists := rc.cache[domain]
	rc.mu.RUnlock()

	if exists && time.Since(entry.fetchedAt) < rc.ttl {
		return entry, nil
	}

	// Fetch robots.txt
	rc.mu.Lock()
	defer rc.mu.Unlock()

	// Double-check after acquiring write lock
	entry, exists = rc.cache[domain]
	if exists && time.Since(entry.fetchedAt) < rc.ttl {
		return entry, nil
	}

	// Fetch from server
	resp, err := rc.client.Fetch(ctx, robotsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch robots.txt: %w", err)
	}

	if resp.StatusCode == 404 || resp.StatusCode == 403 {
		// No robots.txt, allow everything
		entry = &robotsCacheEntry{
			robots:    nil,
			fetchedAt: time.Now(),
		}
		rc.cache[domain] = entry
		return entry, nil
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Parse robots.txt
	robots, err := robotstxt.FromBytes(resp.Body)
	if err != nil {
		rc.logger.Warn("failed to parse robots.txt",
			zap.String("url", robotsURL),
			zap.Error(err),
		)
		// Create empty entry on parse error
		entry = &robotsCacheEntry{
			robots:    nil,
			fetchedAt: time.Now(),
		}
		rc.cache[domain] = entry
		return entry, nil
	}

	// Extract crawl delay and sitemaps
	crawlDelay := rc.extractCrawlDelay(robots)
	sitemaps := rc.extractSitemaps(resp.Body)

	entry = &robotsCacheEntry{
		robots:     robots,
		crawlDelay: crawlDelay,
		sitemaps:   sitemaps,
		fetchedAt:  time.Now(),
	}

	rc.cache[domain] = entry

	rc.logger.Info("robots.txt cached",
		zap.String("domain", domain),
		zap.Duration("crawl_delay", crawlDelay),
		zap.Int("sitemaps", len(sitemaps)),
	)

	return entry, nil
}

// extractCrawlDelay extracts crawl delay from robots.txt
func (rc *RobotsCache) extractCrawlDelay(robots *robotstxt.RobotsData) time.Duration {
	// The robotstxt library doesn't expose CrawlDelay directly
	// We'd need to parse the raw content for this
	// For now, return 0 and handle in the parser if needed
	return 0
}

// extractSitemaps extracts sitemap URLs from robots.txt content
func (rc *RobotsCache) extractSitemaps(content []byte) []string {
	var sitemaps []string
	lines := strings.Split(string(content), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(strings.ToLower(line), "sitemap:") {
			sitemap := strings.TrimSpace(line[8:])
			if sitemap != "" {
				sitemaps = append(sitemaps, sitemap)
			}
		}
	}

	return sitemaps
}

// cleanup periodically removes expired cache entries
func (rc *RobotsCache) cleanup() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		rc.mu.Lock()
		now := time.Now()
		for domain, entry := range rc.cache {
			if now.Sub(entry.fetchedAt) > rc.ttl {
				delete(rc.cache, domain)
			}
		}
		rc.mu.Unlock()
	}
}

// Invalidate removes a domain from the cache
func (rc *RobotsCache) Invalidate(domain string) {
	rc.mu.Lock()
	defer rc.mu.Unlock()
	delete(rc.cache, domain)
}
