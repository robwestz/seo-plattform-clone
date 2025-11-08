package storage

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
)

// MongoStorage handles MongoDB operations for raw HTML and large content
type MongoStorage struct {
	client   *mongo.Client
	database *mongo.Database
	logger   *zap.Logger
}

// NewMongoStorage creates a new MongoDB storage instance
func NewMongoStorage(uri, database string, logger *zap.Logger) (*MongoStorage, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMaxPoolSize(50)
	clientOptions.SetMinPoolSize(10)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	logger.Info("connected to MongoDB", zap.String("database", database))

	db := client.Database(database)

	// Create indexes
	ms := &MongoStorage{
		client:   client,
		database: db,
		logger:   logger,
	}

	if err := ms.createIndexes(ctx); err != nil {
		logger.Warn("failed to create indexes", zap.Error(err))
	}

	return ms, nil
}

// PageContent represents the content stored in MongoDB
type PageContent struct {
	URL         string                 `bson:"url"`
	FinalURL    string                 `bson:"final_url"`
	ContentHash string                 `bson:"content_hash"`
	HTML        string                 `bson:"html"`
	PlainText   string                 `bson:"plain_text,omitempty"`
	Headers     map[string][]string    `bson:"headers"`
	Metadata    map[string]interface{} `bson:"metadata,omitempty"`
	Screenshot  []byte                 `bson:"screenshot,omitempty"`
	CrawledAt   time.Time              `bson:"crawled_at"`
	CreatedAt   time.Time              `bson:"created_at"`
	UpdatedAt   time.Time              `bson:"updated_at"`
}

// PageVersion represents a historical version of a page
type PageVersion struct {
	URL         string                 `bson:"url"`
	ContentHash string                 `bson:"content_hash"`
	HTML        string                 `bson:"html"`
	Metadata    map[string]interface{} `bson:"metadata,omitempty"`
	CrawledAt   time.Time              `bson:"crawled_at"`
	CreatedAt   time.Time              `bson:"created_at"`
}

// SavePageContent saves raw HTML content to MongoDB
func (ms *MongoStorage) SavePageContent(ctx context.Context, content *PageContent) error {
	collection := ms.database.Collection("page_content")

	content.UpdatedAt = time.Now()
	if content.CreatedAt.IsZero() {
		content.CreatedAt = time.Now()
	}

	filter := bson.M{"url": content.URL}
	update := bson.M{
		"$set": content,
		"$setOnInsert": bson.M{
			"created_at": content.CreatedAt,
		},
	}

	opts := options.Update().SetUpsert(true)
	result, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to save page content: %w", err)
	}

	ms.logger.Info("saved page content",
		zap.String("url", content.URL),
		zap.Int64("modified", result.ModifiedCount),
		zap.Int64("upserted", result.UpsertedCount),
	)

	return nil
}

// GetPageContent retrieves page content by URL
func (ms *MongoStorage) GetPageContent(ctx context.Context, url string) (*PageContent, error) {
	collection := ms.database.Collection("page_content")

	var content PageContent
	filter := bson.M{"url": url}

	err := collection.FindOne(ctx, filter).Decode(&content)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("page content not found")
		}
		return nil, fmt.Errorf("failed to get page content: %w", err)
	}

	return &content, nil
}

// SavePageVersion saves a historical version of a page
func (ms *MongoStorage) SavePageVersion(ctx context.Context, version *PageVersion) error {
	collection := ms.database.Collection("page_versions")

	version.CreatedAt = time.Now()

	_, err := collection.InsertOne(ctx, version)
	if err != nil {
		return fmt.Errorf("failed to save page version: %w", err)
	}

	ms.logger.Info("saved page version",
		zap.String("url", version.URL),
		zap.String("hash", version.ContentHash),
	)

	return nil
}

// GetPageVersions retrieves all versions of a page
func (ms *MongoStorage) GetPageVersions(ctx context.Context, url string, limit int) ([]PageVersion, error) {
	collection := ms.database.Collection("page_versions")

	filter := bson.M{"url": url}
	opts := options.Find().
		SetSort(bson.D{{Key: "crawled_at", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get page versions: %w", err)
	}
	defer cursor.Close(ctx)

	var versions []PageVersion
	if err := cursor.All(ctx, &versions); err != nil {
		return nil, fmt.Errorf("failed to decode page versions: %w", err)
	}

	return versions, nil
}

// SaveScreenshot saves a screenshot for a page
func (ms *MongoStorage) SaveScreenshot(ctx context.Context, url string, screenshot []byte) error {
	collection := ms.database.Collection("page_content")

	filter := bson.M{"url": url}
	update := bson.M{
		"$set": bson.M{
			"screenshot":  screenshot,
			"updated_at": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to save screenshot: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("page not found")
	}

	ms.logger.Info("saved screenshot",
		zap.String("url", url),
		zap.Int("size", len(screenshot)),
	)

	return nil
}

// DeleteOldVersions deletes versions older than the specified duration
func (ms *MongoStorage) DeleteOldVersions(ctx context.Context, olderThan time.Duration) (int64, error) {
	collection := ms.database.Collection("page_versions")

	cutoff := time.Now().Add(-olderThan)
	filter := bson.M{"created_at": bson.M{"$lt": cutoff}}

	result, err := collection.DeleteMany(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("failed to delete old versions: %w", err)
	}

	ms.logger.Info("deleted old versions",
		zap.Int64("count", result.DeletedCount),
		zap.Time("cutoff", cutoff),
	)

	return result.DeletedCount, nil
}

// createIndexes creates necessary indexes for collections
func (ms *MongoStorage) createIndexes(ctx context.Context) error {
	// Indexes for page_content
	contentCollection := ms.database.Collection("page_content")
	contentIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "url", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "content_hash", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "crawled_at", Value: -1}},
		},
	}

	_, err := contentCollection.Indexes().CreateMany(ctx, contentIndexes)
	if err != nil {
		return fmt.Errorf("failed to create content indexes: %w", err)
	}

	// Indexes for page_versions
	versionsCollection := ms.database.Collection("page_versions")
	versionIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "url", Value: 1},
				{Key: "crawled_at", Value: -1},
			},
		},
		{
			Keys: bson.D{{Key: "content_hash", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: 1}},
		},
	}

	_, err = versionsCollection.Indexes().CreateMany(ctx, versionIndexes)
	if err != nil {
		return fmt.Errorf("failed to create version indexes: %w", err)
	}

	ms.logger.Info("created MongoDB indexes")
	return nil
}

// Close closes the MongoDB connection
func (ms *MongoStorage) Close(ctx context.Context) error {
	if err := ms.client.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
	}

	ms.logger.Info("closed MongoDB connection")
	return nil
}
