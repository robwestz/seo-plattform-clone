-- Database initialization script for SEO Crawler
-- This script creates the necessary tables for the crawler infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crawl jobs table
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    max_depth INTEGER DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error TEXT,
    metadata JSONB
);

CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_domain ON crawl_jobs(domain);
CREATE INDEX idx_crawl_jobs_created_at ON crawl_jobs(created_at);
CREATE INDEX idx_crawl_jobs_priority ON crawl_jobs(priority DESC);

-- Page metadata table
CREATE TABLE IF NOT EXISTS page_metadata (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    final_url TEXT,
    domain VARCHAR(255) NOT NULL,
    status_code INTEGER,
    content_type VARCHAR(255),
    content_hash VARCHAR(64),
    title TEXT,
    description TEXT,
    keywords TEXT,
    canonical_url TEXT,
    language VARCHAR(10),
    h1_count INTEGER DEFAULT 0,
    h2_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    link_count INTEGER DEFAULT 0,
    internal_links INTEGER DEFAULT 0,
    external_links INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    load_time INTEGER,
    crawled_at TIMESTAMP NOT NULL,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_count INTEGER DEFAULT 0
);

CREATE INDEX idx_page_metadata_url ON page_metadata(url);
CREATE INDEX idx_page_metadata_domain ON page_metadata(domain);
CREATE INDEX idx_page_metadata_content_hash ON page_metadata(content_hash);
CREATE INDEX idx_page_metadata_crawled_at ON page_metadata(crawled_at);
CREATE INDEX idx_page_metadata_status_code ON page_metadata(status_code);

-- Links table
CREATE TABLE IF NOT EXISTS page_links (
    id BIGSERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    link_type VARCHAR(50),
    nofollow BOOLEAN DEFAULT FALSE,
    discovered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_links_source ON page_links(source_url);
CREATE INDEX idx_page_links_target ON page_links(target_url);
CREATE INDEX idx_page_links_type ON page_links(link_type);

-- Images table
CREATE TABLE IF NOT EXISTS page_images (
    id BIGSERIAL PRIMARY KEY,
    page_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    title TEXT,
    width INTEGER,
    height INTEGER,
    discovered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_images_page_url ON page_images(page_url);
CREATE INDEX idx_page_images_image_url ON page_images(image_url);

-- Crawl statistics table
CREATE TABLE IF NOT EXISTS crawl_stats (
    id BIGSERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    total_pages INTEGER DEFAULT 0,
    successful_crawls INTEGER DEFAULT 0,
    failed_crawls INTEGER DEFAULT 0,
    total_links INTEGER DEFAULT 0,
    total_images INTEGER DEFAULT 0,
    avg_load_time INTEGER DEFAULT 0,
    last_crawl_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_crawl_stats_domain ON crawl_stats(domain);

-- Robots.txt cache table
CREATE TABLE IF NOT EXISTS robots_cache (
    id BIGSERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    robots_txt TEXT,
    crawl_delay INTEGER,
    sitemaps JSONB,
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_robots_cache_domain ON robots_cache(domain);
CREATE INDEX idx_robots_cache_expires_at ON robots_cache(expires_at);

-- Sitemap entries table
CREATE TABLE IF NOT EXISTS sitemap_entries (
    id BIGSERIAL PRIMARY KEY,
    sitemap_url TEXT NOT NULL,
    page_url TEXT NOT NULL,
    last_mod TIMESTAMP,
    change_freq VARCHAR(20),
    priority DECIMAL(2,1),
    discovered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sitemap_entries_sitemap_url ON sitemap_entries(sitemap_url);
CREATE INDEX idx_sitemap_entries_page_url ON sitemap_entries(page_url);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_crawl_jobs_updated_at BEFORE UPDATE ON crawl_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crawl_stats_updated_at BEFORE UPDATE ON crawl_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default crawl stats for testing
COMMENT ON TABLE crawl_jobs IS 'Stores crawl job information and status';
COMMENT ON TABLE page_metadata IS 'Stores metadata extracted from crawled pages';
COMMENT ON TABLE page_links IS 'Stores links found on crawled pages';
COMMENT ON TABLE page_images IS 'Stores images found on crawled pages';
COMMENT ON TABLE crawl_stats IS 'Aggregated statistics per domain';
COMMENT ON TABLE robots_cache IS 'Cached robots.txt data';
COMMENT ON TABLE sitemap_entries IS 'URLs discovered from sitemaps';
