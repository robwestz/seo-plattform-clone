import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * API V2 Controller
 * Sample endpoints for API version 2 (future version)
 * Demonstrates improved response formats and new features
 */
@ApiTags('API v2')
@Controller('api/v2')
export class V2Controller {
  @Get('health')
  @ApiOperation({ summary: 'Health check for v2 API' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  healthCheck() {
    return {
      version: '2.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get API v2 information' })
  @ApiResponse({ status: 200, description: 'API information' })
  getInfo() {
    return {
      version: '2',
      name: 'SEO Intelligence Platform API',
      description: 'Enhanced RESTful API with improved performance and new features',
      features: [
        'Improved pagination',
        'Enhanced filtering',
        'Batch operations',
        'Real-time webhooks',
      ],
      endpoints: {
        projects: '/api/v2/projects',
        keywords: '/api/v2/keywords',
        rankings: '/api/v2/rankings',
        audits: '/api/v2/audits',
        analytics: '/api/v2/analytics',
      },
      documentation: '/api/docs',
      graphql: '/graphql',
      websocket: '/realtime',
    };
  }
}
