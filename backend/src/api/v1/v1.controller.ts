import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * API V1 Controller
 * Sample endpoints for API version 1
 * These are placeholder examples showing the structure
 */
@ApiTags('API v1')
@Controller('api/v1')
export class V1Controller {
  @Get('health')
  @ApiOperation({ summary: 'Health check for v1 API' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  healthCheck() {
    return {
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get API v1 information' })
  @ApiResponse({ status: 200, description: 'API information' })
  getInfo() {
    return {
      version: '1',
      name: 'SEO Intelligence Platform API',
      description: 'RESTful API for SEO analytics and monitoring',
      endpoints: {
        projects: '/api/v1/projects',
        keywords: '/api/v1/keywords',
        rankings: '/api/v1/rankings',
        audits: '/api/v1/audits',
      },
      documentation: '/api/docs',
    };
  }
}
