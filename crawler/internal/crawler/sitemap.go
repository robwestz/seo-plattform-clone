package crawler

import (
	"compress/gzip"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"strings"
	"time"

	"go.uber.org/zap"
)

// SitemapParser parses XML sitemaps
type SitemapParser struct {
	client *HTTPClient
	logger *zap.Logger
}

// NewSitemapParser creates a new sitemap parser
func NewSitemapParser(client *HTTPClient, logger *zap.Logger) *SitemapParser {
	return &SitemapParser{
		client: client,
		logger: logger,
	}
}

// URLSet represents a sitemap URL set
type URLSet struct {
	XMLName xml.Name    `xml:"urlset"`
	URLs    []SitemapURL `xml:"url"`
}

// SitemapIndex represents a sitemap index
type SitemapIndex struct {
	XMLName  xml.Name  `xml:"sitemapindex"`
	Sitemaps []Sitemap `xml:"sitemap"`
}

// SitemapURL represents a single URL in a sitemap
type SitemapURL struct {
	Loc        string  `xml:"loc"`
	LastMod    string  `xml:"lastmod,omitempty"`
	ChangeFreq string  `xml:"changefreq,omitempty"`
	Priority   float64 `xml:"priority,omitempty"`
}

// Sitemap represents a sitemap reference in a sitemap index
type Sitemap struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod,omitempty"`
}

// SitemapResult contains the parsed sitemap data
type SitemapResult struct {
	URLs     []SitemapURL
	Sitemaps []string
	IsSitemapIndex bool
}

// Parse fetches and parses a sitemap
func (sp *SitemapParser) Parse(ctx context.Context, sitemapURL string) (*SitemapResult, error) {
	sp.logger.Info("parsing sitemap", zap.String("url", sitemapURL))

	resp, err := sp.client.Fetch(ctx, sitemapURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch sitemap: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Handle gzip compression
	var reader io.Reader = strings.NewReader(string(resp.Body))
	if strings.HasSuffix(sitemapURL, ".gz") || resp.Headers.Get("Content-Encoding") == "gzip" {
		gzReader, err := gzip.NewReader(strings.NewReader(string(resp.Body)))
		if err != nil {
			return nil, fmt.Errorf("failed to create gzip reader: %w", err)
		}
		defer gzReader.Close()
		reader = gzReader
	}

	// Read the content
	content, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read sitemap content: %w", err)
	}

	// Try to parse as sitemap index first
	var sitemapIndex SitemapIndex
	if err := xml.Unmarshal(content, &sitemapIndex); err == nil && len(sitemapIndex.Sitemaps) > 0 {
		sp.logger.Info("parsed sitemap index",
			zap.String("url", sitemapURL),
			zap.Int("sitemaps", len(sitemapIndex.Sitemaps)),
		)

		sitemaps := make([]string, len(sitemapIndex.Sitemaps))
		for i, sm := range sitemapIndex.Sitemaps {
			sitemaps[i] = sm.Loc
		}

		return &SitemapResult{
			Sitemaps:       sitemaps,
			IsSitemapIndex: true,
		}, nil
	}

	// Parse as URL set
	var urlSet URLSet
	if err := xml.Unmarshal(content, &urlSet); err != nil {
		return nil, fmt.Errorf("failed to parse sitemap: %w", err)
	}

	sp.logger.Info("parsed sitemap",
		zap.String("url", sitemapURL),
		zap.Int("urls", len(urlSet.URLs)),
	)

	return &SitemapResult{
		URLs:           urlSet.URLs,
		IsSitemapIndex: false,
	}, nil
}

// ParseRecursive recursively parses a sitemap and all referenced sitemaps
func (sp *SitemapParser) ParseRecursive(ctx context.Context, sitemapURL string, maxDepth int) ([]SitemapURL, error) {
	return sp.parseRecursiveHelper(ctx, sitemapURL, 0, maxDepth)
}

func (sp *SitemapParser) parseRecursiveHelper(ctx context.Context, sitemapURL string, depth, maxDepth int) ([]SitemapURL, error) {
	if depth > maxDepth {
		sp.logger.Warn("max depth reached", zap.String("url", sitemapURL), zap.Int("depth", depth))
		return nil, nil
	}

	result, err := sp.Parse(ctx, sitemapURL)
	if err != nil {
		return nil, err
	}

	if !result.IsSitemapIndex {
		return result.URLs, nil
	}

	// Recursively parse child sitemaps
	var allURLs []SitemapURL
	for _, childURL := range result.Sitemaps {
		childURLs, err := sp.parseRecursiveHelper(ctx, childURL, depth+1, maxDepth)
		if err != nil {
			sp.logger.Warn("failed to parse child sitemap",
				zap.String("parent", sitemapURL),
				zap.String("child", childURL),
				zap.Error(err),
			)
			continue
		}
		allURLs = append(allURLs, childURLs...)
	}

	return allURLs, nil
}

// ParseLastModified parses the lastmod field into a time.Time
func ParseLastModified(lastMod string) (time.Time, error) {
	if lastMod == "" {
		return time.Time{}, nil
	}

	// Try different date formats
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05-07:00",
		"2006-01-02T15:04:05Z",
		"2006-01-02",
	}

	for _, format := range formats {
		t, err := time.Parse(format, lastMod)
		if err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", lastMod)
}
