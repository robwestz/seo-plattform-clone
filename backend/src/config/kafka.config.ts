import { registerAs } from '@nestjs/config';

/**
 * Kafka configuration
 * Event streaming platform for microservices communication
 */
export const kafkaConfig = registerAs('kafka', () => ({
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'seo-platform-backend',
  groupId: process.env.KAFKA_GROUP_ID || 'seo-platform-consumer-group',
  sasl: process.env.KAFKA_SASL_MECHANISM
    ? {
        mechanism: process.env.KAFKA_SASL_MECHANISM,
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      }
    : undefined,
}));
