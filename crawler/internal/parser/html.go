package parser

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"go.uber.org/zap"
)

// HTMLParser parses HTML content
type HTMLParser struct {
	logger *zap.Logger
}

// NewHTMLParser creates a new HTML parser
func NewHTMLParser(logger *zap.Logger) *HTMLParser {
	return &HTMLParser{
		logger: logger,
	}
}

// ParsedHTML represents parsed HTML content
type ParsedHTML struct {
	Title       string
	Description string
	Keywords    string
	MetaTags    map[string]string
	Headings    Headings
	Images      []Image
	Links       []Link
	CanonicalURL string
	Language    string
	Author      string
	OpenGraph   OpenGraphData
	TwitterCard TwitterCardData
	StructuredData []string
}

// Headings represents all heading levels
type Headings struct {
	H1 []string
	H2 []string
	H3 []string
	H4 []string
	H5 []string
	H6 []string
}

// Image represents an image element
type Image struct {
	Src    string
	Alt    string
	Title  string
	Width  string
	Height string
}

// Link represents a link element
type Link struct {
	Href     string
	Text     string
	Rel      string
	NoFollow bool
	External bool
}

// OpenGraphData represents Open Graph meta tags
type OpenGraphData struct {
	Title       string
	Description string
	Image       string
	URL         string
	Type        string
	SiteName    string
}

// TwitterCardData represents Twitter Card meta tags
type TwitterCardData struct {
	Card        string
	Site        string
	Creator     string
	Title       string
	Description string
	Image       string
}

// Parse parses HTML content and extracts data
func (p *HTMLParser) Parse(htmlContent []byte, baseURL string) (*ParsedHTML, error) {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	parsed := &ParsedHTML{
		MetaTags: make(map[string]string),
	}

	// Extract title
	parsed.Title = strings.TrimSpace(doc.Find("title").First().Text())

	// Extract meta tags
	doc.Find("meta").Each(func(i int, s *goquery.Selection) {
		name, nameExists := s.Attr("name")
		property, propertyExists := s.Attr("property")
		content, contentExists := s.Attr("content")

		if !contentExists {
			return
		}

		if nameExists {
			parsed.MetaTags[name] = content

			// Special meta tags
			switch strings.ToLower(name) {
			case "description":
				parsed.Description = content
			case "keywords":
				parsed.Keywords = content
			case "author":
				parsed.Author = content
			}
		}

		if propertyExists {
			parsed.MetaTags[property] = content

			// Open Graph tags
			if strings.HasPrefix(property, "og:") {
				p.extractOpenGraph(property, content, &parsed.OpenGraph)
			}

			// Twitter Card tags
			if strings.HasPrefix(property, "twitter:") {
				p.extractTwitterCard(property, content, &parsed.TwitterCard)
			}
		}
	})

	// Extract canonical URL
	if canonical, exists := doc.Find("link[rel='canonical']").Attr("href"); exists {
		parsed.CanonicalURL = canonical
	}

	// Extract language
	if lang, exists := doc.Find("html").Attr("lang"); exists {
		parsed.Language = lang
	}

	// Extract headings
	parsed.Headings = p.extractHeadings(doc)

	// Extract images
	parsed.Images = p.extractImages(doc)

	// Extract links
	parsed.Links = p.extractLinks(doc, baseURL)

	// Extract structured data (JSON-LD)
	parsed.StructuredData = p.extractStructuredData(doc)

	return parsed, nil
}

// extractHeadings extracts all heading elements
func (p *HTMLParser) extractHeadings(doc *goquery.Document) Headings {
	headings := Headings{}

	doc.Find("h1").Each(func(i int, s *goquery.Selection) {
		headings.H1 = append(headings.H1, strings.TrimSpace(s.Text()))
	})

	doc.Find("h2").Each(func(i int, s *goquery.Selection) {
		headings.H2 = append(headings.H2, strings.TrimSpace(s.Text()))
	})

	doc.Find("h3").Each(func(i int, s *goquery.Selection) {
		headings.H3 = append(headings.H3, strings.TrimSpace(s.Text()))
	})

	doc.Find("h4").Each(func(i int, s *goquery.Selection) {
		headings.H4 = append(headings.H4, strings.TrimSpace(s.Text()))
	})

	doc.Find("h5").Each(func(i int, s *goquery.Selection) {
		headings.H5 = append(headings.H5, strings.TrimSpace(s.Text()))
	})

	doc.Find("h6").Each(func(i int, s *goquery.Selection) {
		headings.H6 = append(headings.H6, strings.TrimSpace(s.Text()))
	})

	return headings
}

// extractImages extracts all image elements
func (p *HTMLParser) extractImages(doc *goquery.Document) []Image {
	var images []Image

	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		src, _ := s.Attr("src")
		alt, _ := s.Attr("alt")
		title, _ := s.Attr("title")
		width, _ := s.Attr("width")
		height, _ := s.Attr("height")

		if src != "" {
			images = append(images, Image{
				Src:    src,
				Alt:    alt,
				Title:  title,
				Width:  width,
				Height: height,
			})
		}
	})

	return images
}

// extractLinks extracts all link elements
func (p *HTMLParser) extractLinks(doc *goquery.Document, baseURL string) []Link {
	var links []Link

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists || href == "" {
			return
		}

		text := strings.TrimSpace(s.Text())
		rel, _ := s.Attr("rel")

		// Check if nofollow
		noFollow := strings.Contains(strings.ToLower(rel), "nofollow")

		// Check if external (simplified check)
		external := strings.HasPrefix(href, "http://") || strings.HasPrefix(href, "https://")

		links = append(links, Link{
			Href:     href,
			Text:     text,
			Rel:      rel,
			NoFollow: noFollow,
			External: external,
		})
	})

	return links
}

// extractOpenGraph extracts Open Graph metadata
func (p *HTMLParser) extractOpenGraph(property, content string, og *OpenGraphData) {
	switch property {
	case "og:title":
		og.Title = content
	case "og:description":
		og.Description = content
	case "og:image":
		og.Image = content
	case "og:url":
		og.URL = content
	case "og:type":
		og.Type = content
	case "og:site_name":
		og.SiteName = content
	}
}

// extractTwitterCard extracts Twitter Card metadata
func (p *HTMLParser) extractTwitterCard(property, content string, tc *TwitterCardData) {
	switch property {
	case "twitter:card":
		tc.Card = content
	case "twitter:site":
		tc.Site = content
	case "twitter:creator":
		tc.Creator = content
	case "twitter:title":
		tc.Title = content
	case "twitter:description":
		tc.Description = content
	case "twitter:image":
		tc.Image = content
	}
}

// extractStructuredData extracts JSON-LD structured data
func (p *HTMLParser) extractStructuredData(doc *goquery.Document) []string {
	var structuredData []string

	doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
		data := strings.TrimSpace(s.Text())
		if data != "" {
			structuredData = append(structuredData, data)
		}
	})

	return structuredData
}

// ExtractText extracts plain text from HTML
func (p *HTMLParser) ExtractText(htmlContent []byte) (string, error) {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(htmlContent))
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Remove script and style elements
	doc.Find("script, style, noscript").Each(func(i int, s *goquery.Selection) {
		s.Remove()
	})

	text := strings.TrimSpace(doc.Find("body").Text())
	return text, nil
}
