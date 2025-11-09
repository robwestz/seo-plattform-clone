import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { KeywordResolver } from './resolvers/keyword.resolver';
import { ContentResolver } from './resolvers/content.resolver';
import { RankingSubscriptionResolver } from './subscriptions/ranking.subscription';
import {
  KeywordDataLoader,
  ProjectDataLoader,
  ContentDataLoader,
  BacklinkDataLoader,
} from './dataloaders/keyword.dataloader';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { KeywordsModule } from '../keywords/keywords.module';
import { KeywordClusteringModule } from '../keyword-clustering/keyword-clustering.module';
import { SearchIntentModule } from '../search-intent/search-intent.module';
import { ContentAnalysisModule } from '../content-analysis/content-analysis.module';
import { ContentGapAnalysisModule } from '../content-gap-analysis/content-gap-analysis.module';
import { ApiIntegrationsModule } from '../api-integrations/api-integrations.module';

/**
 * GraphQL API Module
 * Full GraphQL API with subscriptions and DataLoaders
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      context: ({ req, connection }) => {
        // For subscriptions, use connection context
        if (connection) {
          return { req: connection.context };
        }
        // For queries/mutations, use HTTP request
        return { req };
      },
      formatError: (error) => {
        // Custom error formatting
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path,
          extensions: error.extensions,
        };
      },
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    }),
    KeywordsModule,
    KeywordClusteringModule,
    SearchIntentModule,
    ContentAnalysisModule,
    ContentGapAnalysisModule,
    ApiIntegrationsModule,
  ],
  providers: [
    // Resolvers
    KeywordResolver,
    ContentResolver,
    RankingSubscriptionResolver,

    // DataLoaders
    KeywordDataLoader,
    ProjectDataLoader,
    ContentDataLoader,
    BacklinkDataLoader,

    // Guards
    GqlAuthGuard,
  ],
  exports: [
    KeywordDataLoader,
    ProjectDataLoader,
    ContentDataLoader,
    BacklinkDataLoader,
  ],
})
export class GraphQLApiModule {}
