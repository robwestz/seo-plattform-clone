import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

/**
 * Events Service
 * Manages Kafka producer and consumer for event-driven communication
 * Used for microservices communication and async task processing
 */
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly topics = {
    PROJECT_CREATED: 'project.created',
    PROJECT_UPDATED: 'project.updated',
    PROJECT_DELETED: 'project.deleted',
    USER_REGISTERED: 'user.registered',
    TENANT_CREATED: 'tenant.created',
    CRAWL_REQUESTED: 'crawl.requested',
    CRAWL_COMPLETED: 'crawl.completed',
    AUDIT_REQUESTED: 'audit.requested',
    AUDIT_COMPLETED: 'audit.completed',
    RANK_CHECK_REQUESTED: 'rank.check.requested',
    RANK_CHECK_COMPLETED: 'rank.check.completed',
  };

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers');
    const clientId = this.configService.get<string>('kafka.clientId');
    const sasl = this.configService.get<any>('kafka.sasl');

    this.logger.log(`Initializing Kafka client: ${clientId} with brokers: ${brokers.join(', ')}`);

    this.kafka = new Kafka({
      clientId,
      brokers,
      sasl: sasl || undefined,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.configService.get<string>('kafka.groupId'),
    });
  }

  /**
   * Initialize Kafka connections on module startup
   */
  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');

      await this.consumer.connect();
      this.logger.log('Kafka consumer connected successfully');

      // Subscribe to topics
      await this.subscribeToTopics();
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  /**
   * Disconnect Kafka connections on module shutdown
   */
  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    this.logger.log('Kafka connections closed');
  }

  /**
   * Subscribe to Kafka topics
   */
  private async subscribeToTopics() {
    const topicsToSubscribe = Object.values(this.topics);

    for (const topic of topicsToSubscribe) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    this.logger.log(`Subscribed to topics: ${topicsToSubscribe.join(', ')}`);

    // Start consuming messages
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  /**
   * Handle incoming Kafka messages
   * @param payload - Message payload
   */
  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    const value = message.value?.toString();

    this.logger.debug(`Received message from topic ${topic}:${partition}`, {
      offset: message.offset,
      value,
    });

    try {
      const data = JSON.parse(value || '{}');

      // Route message to appropriate handler based on topic
      switch (topic) {
        case this.topics.CRAWL_REQUESTED:
          await this.handleCrawlRequested(data);
          break;
        case this.topics.AUDIT_REQUESTED:
          await this.handleAuditRequested(data);
          break;
        case this.topics.RANK_CHECK_REQUESTED:
          await this.handleRankCheckRequested(data);
          break;
        default:
          this.logger.debug(`No handler for topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}`, error);
    }
  }

  /**
   * Publish an event to Kafka
   * @param topic - Topic name
   * @param data - Event data
   * @param key - Optional message key for partitioning
   */
  async publishEvent(topic: string, data: any, key?: string) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(data),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.log(`Event published to topic ${topic}`, { key, data });
    } catch (error) {
      this.logger.error(`Failed to publish event to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Publish project created event
   * @param projectId - Project ID
   * @param tenantId - Tenant ID
   * @param projectData - Project data
   */
  async publishProjectCreated(projectId: string, tenantId: string, projectData: any) {
    await this.publishEvent(this.topics.PROJECT_CREATED, {
      projectId,
      tenantId,
      ...projectData,
      timestamp: new Date().toISOString(),
    }, projectId);
  }

  /**
   * Publish project updated event
   * @param projectId - Project ID
   * @param tenantId - Tenant ID
   * @param changes - Updated fields
   */
  async publishProjectUpdated(projectId: string, tenantId: string, changes: any) {
    await this.publishEvent(this.topics.PROJECT_UPDATED, {
      projectId,
      tenantId,
      changes,
      timestamp: new Date().toISOString(),
    }, projectId);
  }

  /**
   * Publish crawl requested event
   * @param projectId - Project ID
   * @param tenantId - Tenant ID
   * @param options - Crawl options
   */
  async publishCrawlRequested(projectId: string, tenantId: string, options?: any) {
    await this.publishEvent(this.topics.CRAWL_REQUESTED, {
      projectId,
      tenantId,
      options: options || {},
      timestamp: new Date().toISOString(),
    }, projectId);
  }

  /**
   * Publish audit requested event
   * @param projectId - Project ID
   * @param tenantId - Tenant ID
   * @param auditType - Type of audit
   */
  async publishAuditRequested(projectId: string, tenantId: string, auditType: string) {
    await this.publishEvent(this.topics.AUDIT_REQUESTED, {
      projectId,
      tenantId,
      auditType,
      timestamp: new Date().toISOString(),
    }, projectId);
  }

  /**
   * Publish rank check requested event
   * @param projectId - Project ID
   * @param tenantId - Tenant ID
   * @param keywords - Keywords to check
   */
  async publishRankCheckRequested(projectId: string, tenantId: string, keywords: string[]) {
    await this.publishEvent(this.topics.RANK_CHECK_REQUESTED, {
      projectId,
      tenantId,
      keywords,
      timestamp: new Date().toISOString(),
    }, projectId);
  }

  /**
   * Handle crawl requested event
   * @param data - Event data
   */
  private async handleCrawlRequested(data: any) {
    this.logger.log(`Handling crawl request for project: ${data.projectId}`);
    // Implementation will be handled by crawler microservice
    // This is a placeholder for demonstration
  }

  /**
   * Handle audit requested event
   * @param data - Event data
   */
  private async handleAuditRequested(data: any) {
    this.logger.log(`Handling audit request for project: ${data.projectId}`);
    // Implementation will be handled by audit microservice
    // This is a placeholder for demonstration
  }

  /**
   * Handle rank check requested event
   * @param data - Event data
   */
  private async handleRankCheckRequested(data: any) {
    this.logger.log(`Handling rank check request for project: ${data.projectId}`);
    // Implementation will be handled by rank checker microservice
    // This is a placeholder for demonstration
  }

  /**
   * Get available topics
   * @returns Object containing all topic names
   */
  getTopics() {
    return this.topics;
  }
}
