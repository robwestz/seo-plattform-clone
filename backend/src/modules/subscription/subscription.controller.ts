import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Subscription Controller
 * Manages subscription plans and billing
 */
@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Create a new subscription
   */
  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.create(tenantId, createDto, userId);
  }

  /**
   * Get current subscription
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription details' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getCurrentSubscription(@CurrentTenant() tenantId: string) {
    return this.subscriptionService.getCurrentSubscription(tenantId);
  }

  /**
   * Get subscription limits
   */
  @Get('limits')
  @ApiOperation({ summary: 'Get subscription limits and features' })
  @ApiResponse({ status: 200, description: 'Subscription limits' })
  async getLimits(@CurrentTenant() tenantId: string) {
    return this.subscriptionService.getLimits(tenantId);
  }

  /**
   * Get all available plans
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'Available subscription plans' })
  async getPlans() {
    return this.subscriptionService.getAllPlans();
  }

  /**
   * Update subscription plan
   */
  @Put('plan')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updatePlan(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updatePlan(tenantId, updateDto, userId);
  }

  /**
   * Cancel subscription
   */
  @Delete('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body('cancelAtPeriodEnd') cancelAtPeriodEnd = true,
  ) {
    return this.subscriptionService.cancel(tenantId, cancelAtPeriodEnd, userId);
  }

  /**
   * Reactivate subscription
   */
  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  @ApiResponse({ status: 404, description: 'No cancelled subscription found' })
  async reactivate(@CurrentTenant() tenantId: string, @CurrentUser() userId: string) {
    return this.subscriptionService.reactivate(tenantId, userId);
  }

  /**
   * Get subscription history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get subscription change history' })
  @ApiResponse({ status: 200, description: 'Subscription history' })
  async getHistory(@CurrentTenant() tenantId: string) {
    return this.subscriptionService.getHistory(tenantId);
  }
}
