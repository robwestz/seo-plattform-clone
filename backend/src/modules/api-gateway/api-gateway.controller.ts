import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * API Gateway Controller
 * Catches all requests and routes through gateway
 */
@Controller('gateway')
@ApiExcludeController()
export class ApiGatewayController {
  constructor(private readonly gatewayService: ApiGatewayService) {}

  /**
   * Handle all requests through gateway
   */
  @All('*')
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const gatewayRequest = {
        path: req.path,
        method: req.method,
        headers: req.headers as Record<string, string>,
        query: req.query as Record<string, string>,
        body: req.body,
        tenantId: (req as any).user?.tenantId,
        userId: (req as any).user?.id,
      };

      const response = await this.gatewayService.routeRequest(gatewayRequest);

      // Set headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Set custom headers
      res.setHeader('X-Gateway-Target', response.targetUrl);
      res.setHeader('X-Gateway-Duration', response.duration.toString());

      res.status(response.status).json(response.body);
    } catch (error) {
      res.status(error.status || HttpStatus.BAD_GATEWAY).json({
        statusCode: error.status || HttpStatus.BAD_GATEWAY,
        message: error.message || 'Gateway error',
        error: error.name || 'GatewayError',
      });
    }
  }
}
