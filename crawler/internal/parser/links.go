package parser

import (
	"net/url"
	"strings"

	"go.uber.org/zap"
)

// LinkExtractor extracts and normalizes links from HTML
type LinkExtractor struct {
	logger *zap.Logger
}

// NewLinkExtractor creates a new link extractor
func NewLinkExtractor(logger *zap.Logger) *LinkExtractor {
	return &LinkExtractor{
		logger: logger,
	}
}

// ExtractedLink represents an extracted and normalized link
type ExtractedLink struct {
	URL      string
	Text     string
	NoFollow bool
	External bool
	Type     LinkType
}

// LinkType represents the type of link
type LinkType string

const (
	LinkTypeInternal LinkType = "internal"
	LinkTypeExternal LinkType = "external"
	LinkTypeAnchor   LinkType = "anchor"
	LinkTypeMailto   LinkType = "mailto"
	LinkTypeTel      LinkType = "tel"
	LinkTypeOther    LinkType = "other"
)

// Extract extracts and normalizes links from parsed HTML
func (le *LinkExtractor) Extract(links []Link, baseURL string) []ExtractedLink {
	var extracted []ExtractedLink

	base, err := url.Parse(baseURL)
	if err != nil {
		le.logger.Error("invalid base URL", zap.String("url", baseURL), zap.Error(err))
		return extracted
	}

	for _, link := range links {
		normalized := le.normalize(link.Href, base)
		if normalized == "" {
			continue
		}

		linkType := le.determineType(normalized, base)

		extracted = append(extracted, ExtractedLink{
			URL:      normalized,
			Text:     link.Text,
			NoFollow: link.NoFollow,
			External: link.External,
			Type:     linkType,
		})
	}

	return extracted
}

// normalize normalizes a URL relative to the base URL
func (le *LinkExtractor) normalize(href string, base *url.URL) string {
	// Trim whitespace
	href = strings.TrimSpace(href)

	if href == "" {
		return ""
	}

	// Skip javascript, data, and other special schemes
	if strings.HasPrefix(href, "javascript:") ||
		strings.HasPrefix(href, "data:") ||
		strings.HasPrefix(href, "file:") {
		return ""
	}

	// Parse the href
	parsed, err := url.Parse(href)
	if err != nil {
		le.logger.Warn("failed to parse URL", zap.String("href", href), zap.Error(err))
		return ""
	}

	// Resolve relative URLs
	resolved := base.ResolveReference(parsed)

	// Remove fragment for crawling purposes
	resolved.Fragment = ""

	// Normalize the URL
	normalized := resolved.String()

	// Remove trailing slash for consistency (except for root)
	if len(normalized) > 1 && strings.HasSuffix(normalized, "/") {
		normalized = normalized[:len(normalized)-1]
	}

	return normalized
}

// determineType determines the type of link
func (le *LinkExtractor) determineType(href string, base *url.URL) LinkType {
	if strings.HasPrefix(href, "#") {
		return LinkTypeAnchor
	}

	if strings.HasPrefix(href, "mailto:") {
		return LinkTypeMailto
	}

	if strings.HasPrefix(href, "tel:") {
		return LinkTypeTel
	}

	parsed, err := url.Parse(href)
	if err != nil {
		return LinkTypeOther
	}

	// Check if same domain
	if parsed.Host == base.Host {
		return LinkTypeInternal
	}

	// Check if subdomain
	if strings.HasSuffix(parsed.Host, "."+base.Host) {
		return LinkTypeInternal
	}

	if parsed.Scheme == "http" || parsed.Scheme == "https" {
		return LinkTypeExternal
	}

	return LinkTypeOther
}

// FilterInternalLinks returns only internal links
func (le *LinkExtractor) FilterInternalLinks(links []ExtractedLink) []ExtractedLink {
	var internal []ExtractedLink
	for _, link := range links {
		if link.Type == LinkTypeInternal {
			internal = append(internal, link)
		}
	}
	return internal
}

// FilterFollowLinks returns only links that should be followed (not nofollow)
func (le *LinkExtractor) FilterFollowLinks(links []ExtractedLink) []ExtractedLink {
	var follow []ExtractedLink
	for _, link := range links {
		if !link.NoFollow {
			follow = append(follow, link)
		}
	}
	return follow
}

// DeduplicateLinks removes duplicate URLs from the list
func (le *LinkExtractor) DeduplicateLinks(links []ExtractedLink) []ExtractedLink {
	seen := make(map[string]bool)
	var unique []ExtractedLink

	for _, link := range links {
		if !seen[link.URL] {
			seen[link.URL] = true
			unique = append(unique, link)
		}
	}

	return unique
}

// FilterByScheme filters links by URL scheme
func (le *LinkExtractor) FilterByScheme(links []ExtractedLink, schemes ...string) []ExtractedLink {
	schemeSet := make(map[string]bool)
	for _, scheme := range schemes {
		schemeSet[scheme] = true
	}

	var filtered []ExtractedLink
	for _, link := range links {
		parsed, err := url.Parse(link.URL)
		if err != nil {
			continue
		}

		if schemeSet[parsed.Scheme] {
			filtered = append(filtered, link)
		}
	}

	return filtered
}

// IsAllowedScheme checks if a URL scheme is allowed for crawling
func IsAllowedScheme(urlStr string) bool {
	parsed, err := url.Parse(urlStr)
	if err != nil {
		return false
	}

	scheme := strings.ToLower(parsed.Scheme)
	return scheme == "http" || scheme == "https"
}
