package crawler

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// HTTPClient represents an HTTP client with retry and timeout logic
type HTTPClient struct {
	client *http.Client
	logger *zap.Logger
	config ClientConfig
}

// ClientConfig holds configuration for the HTTP client
type ClientConfig struct {
	Timeout       time.Duration
	MaxRetries    int
	RetryDelay    time.Duration
	UserAgent     string
	FollowRedirect bool
	MaxRedirects  int
}

// NewHTTPClient creates a new HTTP client with custom configuration
func NewHTTPClient(config ClientConfig, logger *zap.Logger) *HTTPClient {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.MaxRetries == 0 {
		config.MaxRetries = 3
	}
	if config.RetryDelay == 0 {
		config.RetryDelay = 1 * time.Second
	}
	if config.UserAgent == "" {
		config.UserAgent = "SEO-Intelligence-Bot/1.0 (+https://seo-platform.com/bot)"
	}
	if config.MaxRedirects == 0 {
		config.MaxRedirects = 10
	}

	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: false,
		},
		DisableCompression: false,
	}

	client := &http.Client{
		Timeout:   config.Timeout,
		Transport: transport,
	}

	if !config.FollowRedirect {
		client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		}
	} else {
		client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
			if len(via) >= config.MaxRedirects {
				return fmt.Errorf("stopped after %d redirects", config.MaxRedirects)
			}
			return nil
		}
	}

	return &HTTPClient{
		client: client,
		logger: logger,
		config: config,
	}
}

// FetchResponse represents the response from a fetch operation
type FetchResponse struct {
	StatusCode  int
	Body        []byte
	Headers     http.Header
	URL         string
	ContentType string
	FinalURL    string
	Duration    time.Duration
}

// Fetch performs an HTTP GET request with retry logic
func (c *HTTPClient) Fetch(ctx context.Context, url string) (*FetchResponse, error) {
	var lastErr error
	startTime := time.Now()

	for attempt := 0; attempt <= c.config.MaxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			delay := c.config.RetryDelay * time.Duration(1<<uint(attempt-1))
			c.logger.Info("retrying request",
				zap.String("url", url),
				zap.Int("attempt", attempt),
				zap.Duration("delay", delay),
			)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}

		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}

		req.Header.Set("User-Agent", c.config.UserAgent)
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
		req.Header.Set("Accept-Language", "en-US,en;q=0.9")
		req.Header.Set("Accept-Encoding", "gzip, deflate")
		req.Header.Set("Connection", "keep-alive")

		resp, err := c.client.Do(req)
		if err != nil {
			lastErr = err
			c.logger.Warn("request failed",
				zap.String("url", url),
				zap.Error(err),
				zap.Int("attempt", attempt),
			)
			continue
		}

		defer resp.Body.Close()

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			lastErr = err
			c.logger.Warn("failed to read response body",
				zap.String("url", url),
				zap.Error(err),
			)
			continue
		}

		// Check if we should retry based on status code
		if c.shouldRetry(resp.StatusCode) && attempt < c.config.MaxRetries {
			lastErr = fmt.Errorf("received status code %d", resp.StatusCode)
			c.logger.Warn("received retriable status code",
				zap.String("url", url),
				zap.Int("status", resp.StatusCode),
			)
			continue
		}

		duration := time.Since(startTime)

		response := &FetchResponse{
			StatusCode:  resp.StatusCode,
			Body:        body,
			Headers:     resp.Header,
			URL:         url,
			ContentType: resp.Header.Get("Content-Type"),
			FinalURL:    resp.Request.URL.String(),
			Duration:    duration,
		}

		c.logger.Info("request successful",
			zap.String("url", url),
			zap.Int("status", resp.StatusCode),
			zap.Int("size", len(body)),
			zap.Duration("duration", duration),
		)

		return response, nil
	}

	return nil, fmt.Errorf("failed after %d attempts: %w", c.config.MaxRetries+1, lastErr)
}

// shouldRetry determines if a request should be retried based on status code
func (c *HTTPClient) shouldRetry(statusCode int) bool {
	// Retry on server errors and some client errors
	return statusCode >= 500 || statusCode == 429 || statusCode == 408
}

// Head performs an HTTP HEAD request
func (c *HTTPClient) Head(ctx context.Context, url string) (*FetchResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "HEAD", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create HEAD request: %w", err)
	}

	req.Header.Set("User-Agent", c.config.UserAgent)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HEAD request failed: %w", err)
	}
	defer resp.Body.Close()

	return &FetchResponse{
		StatusCode:  resp.StatusCode,
		Headers:     resp.Header,
		URL:         url,
		ContentType: resp.Header.Get("Content-Type"),
		FinalURL:    resp.Request.URL.String(),
	}, nil
}
