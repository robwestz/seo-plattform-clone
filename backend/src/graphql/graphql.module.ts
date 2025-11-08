import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Resolvers
import { AuthResolver } from './resolvers/auth.resolver';
import { ProjectResolver } from './resolvers/project.resolver';
import { KeywordResolver } from './resolvers/keyword.resolver';
import { RankingResolver } from './resolvers/ranking.resolver';
import { SubscriptionResolver } from './resolvers/subscription.resolver';

/**
 * GraphQL Module
 * Configures Apollo Server with code-first approach
 * Provides GraphQL API endpoint at /graphql
 */
@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,

      // Use schema-first approach (our schema.graphql file)
      typePaths: ['./**/*.graphql'],

      // Alternatively, for code-first approach, uncomment:
      // autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      // sortSchema: true,

      // GraphQL Playground (disable in production)
      playground: process.env.NODE_ENV !== 'production',

      // Introspection (disable in production)
      introspection: process.env.NODE_ENV !== 'production',

      // Context function - adds user to context
      context: ({ req, connection }) => {
        if (connection) {
          // WebSocket subscription context
          return connection.context;
        }
        // HTTP request context
        return { req };
      },

      // Subscriptions configuration (WebSocket)
      subscriptions: {
        'graphql-ws': {
          // WebSocket authentication
          onConnect: (context: any) => {
            const { connectionParams, extra } = context;

            // Authenticate WebSocket connection
            if (connectionParams?.authorization) {
              const token = connectionParams.authorization.replace('Bearer ', '');
              // TODO: Verify JWT token and add user to context
              return {
                user: { id: 'user-from-token' },
                token,
              };
            }

            // Allow anonymous connections in development
            if (process.env.NODE_ENV === 'development') {
              return { user: null };
            }

            throw new Error('Unauthorized');
          },

          onDisconnect: (context: any) => {
            console.log('WebSocket disconnected');
          },
        },
      },

      // Enable CORS for GraphQL endpoint
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      },

      // Format errors
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },

      // Include stack trace in development
      debug: process.env.NODE_ENV === 'development',

      // Schema definition language
      definitions: {
        path: join(process.cwd(), 'src/graphql/graphql.schema.ts'),
        outputAs: 'class',
      },
    }),
  ],
  providers: [
    AuthResolver,
    ProjectResolver,
    KeywordResolver,
    RankingResolver,
    SubscriptionResolver,
  ],
  exports: [NestGraphQLModule],
})
export class GraphQLModule {}
