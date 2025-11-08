import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ClusterManager } from './cluster-manager';
import { logger } from './logger';
import { RenderRequest, RenderResponse } from './types';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Initialize cluster manager
const clusterManager = new ClusterManager({
  maxConcurrency: parseInt(process.env.CLUSTER_MAX_CONCURRENCY || '10'),
  timeout: parseInt(process.env.CLUSTER_TIMEOUT || '30000'),
  retryLimit: parseInt(process.env.CLUSTER_RETRY_LIMIT || '2'),
  retryDelay: parseInt(process.env.CLUSTER_RETRY_DELAY || '1000'),
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Render endpoint
app.post('/render', async (req: Request, res: Response) => {
  const renderRequest: RenderRequest = req.body;

  if (!renderRequest.url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    logger.info(`Rendering URL: ${renderRequest.url}`);

    const result = await clusterManager.render(renderRequest);

    const response: RenderResponse = {
      url: result.url,
      finalUrl: result.finalUrl,
      html: result.html,
      screenshot: result.screenshot,
      metrics: result.metrics,
      status: result.status,
      error: result.error,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Render error:', error);
    res.status(500).json({
      error: 'Failed to render page',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Batch render endpoint
app.post('/render/batch', async (req: Request, res: Response) => {
  const requests: RenderRequest[] = req.body.requests;

  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({ error: 'Requests array is required' });
  }

  if (requests.length > parseInt(process.env.MAX_BATCH_REQUESTS || '100')) {
    return res.status(400).json({ error: 'Maximum batch size exceeded' });
  }

  try {
    logger.info(`Batch rendering ${requests.length} URLs`);

    const results = await Promise.allSettled(
      requests.map((req) => clusterManager.render(req))
    );

    const responses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          url: result.value.url,
          finalUrl: result.value.finalUrl,
          html: result.value.html,
          screenshot: result.value.screenshot,
          metrics: result.value.metrics,
          status: result.value.status,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          url: requests[index].url,
          error: result.reason.message,
          status: 'failed',
          timestamp: new Date().toISOString(),
        };
      }
    });

    res.json({ results: responses });
  } catch (error) {
    logger.error('Batch render error:', error);
    res.status(500).json({
      error: 'Failed to render pages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Screenshot endpoint
app.post('/screenshot', async (req: Request, res: Response) => {
  const { url, fullPage = true, type = 'png' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    logger.info(`Taking screenshot: ${url}`);

    const result = await clusterManager.screenshot({
      url,
      fullPage,
      type: type as 'png' | 'jpeg',
    });

    res.json({
      url: result.url,
      screenshot: result.screenshot,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Screenshot error:', error);
    res.status(500).json({
      error: 'Failed to take screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Stats endpoint
app.get('/stats', async (req: Request, res: Response) => {
  const stats = await clusterManager.getStats();
  res.json(stats);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  await clusterManager.close();

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    await clusterManager.init();

    app.listen(port, () => {
      logger.info(`Renderer service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
