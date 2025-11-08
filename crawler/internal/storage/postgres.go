package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// PostgresStorage handles PostgreSQL operations for crawler metadata
type PostgresStorage struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

// NewPostgresStorage creates a new PostgreSQL storage instance
func NewPostgresStorage(connString string, logger *zap.Logger) (*PostgresStorage, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse connection string: %w", err)
	}

	// Configure connection pool
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("connected to PostgreSQL")

	return &PostgresStorage{
		pool:   pool,
		logger: logger,
	}, nil
}

// CrawlJob represents a crawl job in the database
type CrawlJob struct {
	ID          int64
	URL         string
	Domain      string
	Status      string
	Priority    int
	Depth       int
	MaxDepth    int
	CreatedAt   time.Time
	UpdatedAt   time.Time
	StartedAt   *time.Time
	CompletedAt *time.Time
	Error       *string
	Metadata    map[string]interface{}
}

// PageMetadata represents metadata for a crawled page
type PageMetadata struct {
	ID           int64
	URL          string
	FinalURL     string
	Domain       string
	StatusCode   int
	ContentType  string
	ContentHash  string
	Title        string
	Description  string
	Keywords     string
	CanonicalURL string
	Language     string
	H1Count      int
	H2Count      int
	ImageCount   int
	LinkCount    int
	InternalLinks int
	ExternalLinks int
	WordCount    int
	LoadTime     int
	CrawledAt    time.Time
	FirstSeenAt  time.Time
	LastSeenAt   time.Time
	ChangeCount  int
}

// CreateCrawlJob creates a new crawl job
func (ps *PostgresStorage) CreateCrawlJob(ctx context.Context, job *CrawlJob) (int64, error) {
	query := `
		INSERT INTO crawl_jobs (url, domain, status, priority, depth, max_depth, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	var id int64
	err := ps.pool.QueryRow(ctx, query,
		job.URL,
		job.Domain,
		job.Status,
		job.Priority,
		job.Depth,
		job.MaxDepth,
		time.Now(),
		time.Now(),
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("failed to create crawl job: %w", err)
	}

	ps.logger.Info("created crawl job",
		zap.Int64("id", id),
		zap.String("url", job.URL),
	)

	return id, nil
}

// UpdateCrawlJobStatus updates the status of a crawl job
func (ps *PostgresStorage) UpdateCrawlJobStatus(ctx context.Context, id int64, status string, errorMsg *string) error {
	query := `
		UPDATE crawl_jobs
		SET status = $1, error = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := ps.pool.Exec(ctx, query, status, errorMsg, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update crawl job status: %w", err)
	}

	return nil
}

// GetCrawlJob retrieves a crawl job by ID
func (ps *PostgresStorage) GetCrawlJob(ctx context.Context, id int64) (*CrawlJob, error) {
	query := `
		SELECT id, url, domain, status, priority, depth, max_depth,
		       created_at, updated_at, started_at, completed_at, error
		FROM crawl_jobs
		WHERE id = $1
	`

	var job CrawlJob
	err := ps.pool.QueryRow(ctx, query, id).Scan(
		&job.ID,
		&job.URL,
		&job.Domain,
		&job.Status,
		&job.Priority,
		&job.Depth,
		&job.MaxDepth,
		&job.CreatedAt,
		&job.UpdatedAt,
		&job.StartedAt,
		&job.CompletedAt,
		&job.Error,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("crawl job not found")
		}
		return nil, fmt.Errorf("failed to get crawl job: %w", err)
	}

	return &job, nil
}

// SavePageMetadata saves or updates page metadata
func (ps *PostgresStorage) SavePageMetadata(ctx context.Context, metadata *PageMetadata) error {
	query := `
		INSERT INTO page_metadata (
			url, final_url, domain, status_code, content_type, content_hash,
			title, description, keywords, canonical_url, language,
			h1_count, h2_count, image_count, link_count,
			internal_links, external_links, word_count, load_time,
			crawled_at, first_seen_at, last_seen_at, change_count
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			$16, $17, $18, $19, $20, $21, $22, $23
		)
		ON CONFLICT (url) DO UPDATE SET
			final_url = EXCLUDED.final_url,
			status_code = EXCLUDED.status_code,
			content_type = EXCLUDED.content_type,
			content_hash = EXCLUDED.content_hash,
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			keywords = EXCLUDED.keywords,
			canonical_url = EXCLUDED.canonical_url,
			language = EXCLUDED.language,
			h1_count = EXCLUDED.h1_count,
			h2_count = EXCLUDED.h2_count,
			image_count = EXCLUDED.image_count,
			link_count = EXCLUDED.link_count,
			internal_links = EXCLUDED.internal_links,
			external_links = EXCLUDED.external_links,
			word_count = EXCLUDED.word_count,
			load_time = EXCLUDED.load_time,
			crawled_at = EXCLUDED.crawled_at,
			last_seen_at = EXCLUDED.last_seen_at,
			change_count = page_metadata.change_count + 1
		RETURNING id
	`

	var id int64
	err := ps.pool.QueryRow(ctx, query,
		metadata.URL,
		metadata.FinalURL,
		metadata.Domain,
		metadata.StatusCode,
		metadata.ContentType,
		metadata.ContentHash,
		metadata.Title,
		metadata.Description,
		metadata.Keywords,
		metadata.CanonicalURL,
		metadata.Language,
		metadata.H1Count,
		metadata.H2Count,
		metadata.ImageCount,
		metadata.LinkCount,
		metadata.InternalLinks,
		metadata.ExternalLinks,
		metadata.WordCount,
		metadata.LoadTime,
		metadata.CrawledAt,
		time.Now(), // first_seen_at
		time.Now(), // last_seen_at
		0,          // change_count
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("failed to save page metadata: %w", err)
	}

	metadata.ID = id

	ps.logger.Info("saved page metadata",
		zap.Int64("id", id),
		zap.String("url", metadata.URL),
	)

	return nil
}

// GetPageMetadata retrieves page metadata by URL
func (ps *PostgresStorage) GetPageMetadata(ctx context.Context, url string) (*PageMetadata, error) {
	query := `
		SELECT id, url, final_url, domain, status_code, content_type, content_hash,
		       title, description, keywords, canonical_url, language,
		       h1_count, h2_count, image_count, link_count,
		       internal_links, external_links, word_count, load_time,
		       crawled_at, first_seen_at, last_seen_at, change_count
		FROM page_metadata
		WHERE url = $1
	`

	var metadata PageMetadata
	err := ps.pool.QueryRow(ctx, query, url).Scan(
		&metadata.ID,
		&metadata.URL,
		&metadata.FinalURL,
		&metadata.Domain,
		&metadata.StatusCode,
		&metadata.ContentType,
		&metadata.ContentHash,
		&metadata.Title,
		&metadata.Description,
		&metadata.Keywords,
		&metadata.CanonicalURL,
		&metadata.Language,
		&metadata.H1Count,
		&metadata.H2Count,
		&metadata.ImageCount,
		&metadata.LinkCount,
		&metadata.InternalLinks,
		&metadata.ExternalLinks,
		&metadata.WordCount,
		&metadata.LoadTime,
		&metadata.CrawledAt,
		&metadata.FirstSeenAt,
		&metadata.LastSeenAt,
		&metadata.ChangeCount,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("page metadata not found")
		}
		return nil, fmt.Errorf("failed to get page metadata: %w", err)
	}

	return &metadata, nil
}

// CheckContentChange checks if content has changed based on hash
func (ps *PostgresStorage) CheckContentChange(ctx context.Context, url, contentHash string) (bool, error) {
	query := `
		SELECT content_hash
		FROM page_metadata
		WHERE url = $1
	`

	var storedHash string
	err := ps.pool.QueryRow(ctx, query, url).Scan(&storedHash)

	if err != nil {
		if err == pgx.ErrNoRows {
			// Page not seen before
			return true, nil
		}
		return false, fmt.Errorf("failed to check content change: %w", err)
	}

	return storedHash != contentHash, nil
}

// Close closes the database connection pool
func (ps *PostgresStorage) Close() {
	ps.pool.Close()
	ps.logger.Info("closed PostgreSQL connection pool")
}
