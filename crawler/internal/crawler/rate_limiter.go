package crawler

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// RateLimiter manages rate limiting per domain
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	config   RateLimiterConfig
}

// RateLimiterConfig holds configuration for rate limiting
type RateLimiterConfig struct {
	DefaultRate       rate.Limit    // requests per second
	DefaultBurst      int           // burst size
	CleanupInterval   time.Duration // how often to clean up unused limiters
	IdleTimeout       time.Duration // remove limiters idle for this duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	if config.DefaultRate == 0 {
		config.DefaultRate = rate.Limit(1) // 1 request per second default
	}
	if config.DefaultBurst == 0 {
		config.DefaultBurst = 3
	}
	if config.CleanupInterval == 0 {
		config.CleanupInterval = 5 * time.Minute
	}
	if config.IdleTimeout == 0 {
		config.IdleTimeout = 10 * time.Minute
	}

	rl := &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		config:   config,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// Wait waits until the rate limiter allows the request for the given domain
func (rl *RateLimiter) Wait(ctx context.Context, domain string) error {
	limiter := rl.getLimiter(domain)
	return limiter.Wait(ctx)
}

// Allow checks if a request is allowed for the given domain
func (rl *RateLimiter) Allow(domain string) bool {
	limiter := rl.getLimiter(domain)
	return limiter.Allow()
}

// SetLimit sets a custom rate limit for a specific domain
func (rl *RateLimiter) SetLimit(domain string, r rate.Limit, burst int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter := rate.NewLimiter(r, burst)
	rl.limiters[domain] = limiter
}

// getLimiter returns the rate limiter for a domain, creating one if it doesn't exist
func (rl *RateLimiter) getLimiter(domain string) *rate.Limiter {
	rl.mu.RLock()
	limiter, exists := rl.limiters[domain]
	rl.mu.RUnlock()

	if exists {
		return limiter
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double-check after acquiring write lock
	limiter, exists = rl.limiters[domain]
	if exists {
		return limiter
	}

	limiter = rate.NewLimiter(rl.config.DefaultRate, rl.config.DefaultBurst)
	rl.limiters[domain] = limiter
	return limiter
}

// cleanup periodically removes unused limiters to prevent memory leaks
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		// In a production system, you'd track last usage time
		// For now, we keep all limiters
		rl.mu.Unlock()
	}
}

// DomainRateLimiter wraps rate limiter with domain-specific delays
type DomainRateLimiter struct {
	rateLimiter *RateLimiter
	delays      map[string]time.Duration
	mu          sync.RWMutex
}

// NewDomainRateLimiter creates a new domain-specific rate limiter
func NewDomainRateLimiter(config RateLimiterConfig) *DomainRateLimiter {
	return &DomainRateLimiter{
		rateLimiter: NewRateLimiter(config),
		delays:      make(map[string]time.Duration),
	}
}

// SetCrawlDelay sets a crawl delay for a specific domain (from robots.txt)
func (drl *DomainRateLimiter) SetCrawlDelay(domain string, delay time.Duration) {
	drl.mu.Lock()
	defer drl.mu.Unlock()

	drl.delays[domain] = delay

	// Update rate limiter based on crawl delay
	if delay > 0 {
		requestsPerSecond := 1.0 / delay.Seconds()
		drl.rateLimiter.SetLimit(domain, rate.Limit(requestsPerSecond), 1)
	}
}

// Wait waits for both rate limiter and crawl delay
func (drl *DomainRateLimiter) Wait(ctx context.Context, domain string) error {
	// Wait for rate limiter
	if err := drl.rateLimiter.Wait(ctx, domain); err != nil {
		return err
	}

	// Wait for crawl delay if set
	drl.mu.RLock()
	delay, exists := drl.delays[domain]
	drl.mu.RUnlock()

	if exists && delay > 0 {
		select {
		case <-time.After(delay):
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}

	return nil
}
