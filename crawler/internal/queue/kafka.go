package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

// KafkaQueue manages Kafka message queue operations
type KafkaQueue struct {
	writer *kafka.Writer
	reader *kafka.Reader
	logger *zap.Logger
	config KafkaConfig
}

// KafkaConfig holds Kafka configuration
type KafkaConfig struct {
	Brokers       []string
	Topic         string
	ConsumerGroup string
	BatchSize     int
	BatchTimeout  time.Duration
}

// NewKafkaQueue creates a new Kafka queue manager
func NewKafkaQueue(config KafkaConfig, logger *zap.Logger) *KafkaQueue {
	if config.BatchSize == 0 {
		config.BatchSize = 100
	}
	if config.BatchTimeout == 0 {
		config.BatchTimeout = 1 * time.Second
	}

	writer := &kafka.Writer{
		Addr:         kafka.TCP(config.Brokers...),
		Topic:        config.Topic,
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    config.BatchSize,
		BatchTimeout: config.BatchTimeout,
		Compression:  kafka.Snappy,
		RequiredAcks: kafka.RequireOne,
		Async:        false,
	}

	var reader *kafka.Reader
	if config.ConsumerGroup != "" {
		reader = kafka.NewReader(kafka.ReaderConfig{
			Brokers:        config.Brokers,
			Topic:          config.Topic,
			GroupID:        config.ConsumerGroup,
			MinBytes:       10e3, // 10KB
			MaxBytes:       10e6, // 10MB
			CommitInterval: time.Second,
			StartOffset:    kafka.LastOffset,
		})
	}

	logger.Info("created Kafka queue",
		zap.Strings("brokers", config.Brokers),
		zap.String("topic", config.Topic),
	)

	return &KafkaQueue{
		writer: writer,
		reader: reader,
		logger: logger,
		config: config,
	}
}

// CrawlMessage represents a crawl job message
type CrawlMessage struct {
	JobID     int64             `json:"job_id"`
	URL       string            `json:"url"`
	Depth     int               `json:"depth"`
	MaxDepth  int               `json:"max_depth"`
	Priority  int               `json:"priority"`
	Metadata  map[string]string `json:"metadata,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
}

// PublishCrawlJob publishes a crawl job to Kafka
func (kq *KafkaQueue) PublishCrawlJob(ctx context.Context, message *CrawlMessage) error {
	message.CreatedAt = time.Now()

	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	msg := kafka.Message{
		Key:   []byte(message.URL),
		Value: data,
		Time:  time.Now(),
	}

	if err := kq.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	kq.logger.Info("published crawl job",
		zap.Int64("job_id", message.JobID),
		zap.String("url", message.URL),
	)

	return nil
}

// PublishCrawlJobBatch publishes multiple crawl jobs in a batch
func (kq *KafkaQueue) PublishCrawlJobBatch(ctx context.Context, messages []*CrawlMessage) error {
	if len(messages) == 0 {
		return nil
	}

	kafkaMessages := make([]kafka.Message, len(messages))
	for i, msg := range messages {
		msg.CreatedAt = time.Now()

		data, err := json.Marshal(msg)
		if err != nil {
			return fmt.Errorf("failed to marshal message %d: %w", i, err)
		}

		kafkaMessages[i] = kafka.Message{
			Key:   []byte(msg.URL),
			Value: data,
			Time:  time.Now(),
		}
	}

	if err := kq.writer.WriteMessages(ctx, kafkaMessages...); err != nil {
		return fmt.Errorf("failed to write messages: %w", err)
	}

	kq.logger.Info("published crawl job batch",
		zap.Int("count", len(messages)),
	)

	return nil
}

// ConsumeCrawlJobs consumes crawl jobs from Kafka
func (kq *KafkaQueue) ConsumeCrawlJobs(ctx context.Context, handler func(*CrawlMessage) error) error {
	if kq.reader == nil {
		return fmt.Errorf("no reader configured")
	}

	kq.logger.Info("starting to consume crawl jobs")

	for {
		select {
		case <-ctx.Done():
			kq.logger.Info("stopping crawl job consumer")
			return ctx.Err()
		default:
			msg, err := kq.reader.FetchMessage(ctx)
			if err != nil {
				kq.logger.Error("failed to fetch message", zap.Error(err))
				continue
			}

			var crawlMsg CrawlMessage
			if err := json.Unmarshal(msg.Value, &crawlMsg); err != nil {
				kq.logger.Error("failed to unmarshal message",
					zap.Error(err),
					zap.ByteString("value", msg.Value),
				)
				// Commit anyway to avoid blocking
				if err := kq.reader.CommitMessages(ctx, msg); err != nil {
					kq.logger.Error("failed to commit message", zap.Error(err))
				}
				continue
			}

			// Process the message
			if err := handler(&crawlMsg); err != nil {
				kq.logger.Error("failed to handle message",
					zap.Error(err),
					zap.String("url", crawlMsg.URL),
				)
				// Don't commit on handler error - will be reprocessed
				continue
			}

			// Commit the message
			if err := kq.reader.CommitMessages(ctx, msg); err != nil {
				kq.logger.Error("failed to commit message", zap.Error(err))
			}

			kq.logger.Info("processed crawl job",
				zap.Int64("job_id", crawlMsg.JobID),
				zap.String("url", crawlMsg.URL),
			)
		}
	}
}

// Stats returns writer statistics
func (kq *KafkaQueue) Stats() kafka.WriterStats {
	return kq.writer.Stats()
}

// Close closes the Kafka connections
func (kq *KafkaQueue) Close() error {
	var errors []error

	if err := kq.writer.Close(); err != nil {
		errors = append(errors, fmt.Errorf("writer close error: %w", err))
	}

	if kq.reader != nil {
		if err := kq.reader.Close(); err != nil {
			errors = append(errors, fmt.Errorf("reader close error: %w", err))
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("close errors: %v", errors)
	}

	kq.logger.Info("closed Kafka connections")
	return nil
}

// CreateTopic creates a Kafka topic (admin operation)
func CreateTopic(brokers []string, topic string, numPartitions int, replicationFactor int) error {
	conn, err := kafka.Dial("tcp", brokers[0])
	if err != nil {
		return fmt.Errorf("failed to dial: %w", err)
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return fmt.Errorf("failed to get controller: %w", err)
	}

	controllerConn, err := kafka.Dial("tcp", fmt.Sprintf("%s:%d", controller.Host, controller.Port))
	if err != nil {
		return fmt.Errorf("failed to dial controller: %w", err)
	}
	defer controllerConn.Close()

	topicConfigs := []kafka.TopicConfig{
		{
			Topic:             topic,
			NumPartitions:     numPartitions,
			ReplicationFactor: replicationFactor,
		},
	}

	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		return fmt.Errorf("failed to create topic: %w", err)
	}

	return nil
}
