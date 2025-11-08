import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for Real-time Updates
 * Provides real-time notifications for:
 * - Ranking updates
 * - Crawl progress
 * - Audit completion
 * - Backlink changes
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // Track connected clients and their rooms
  private readonly clientRooms = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Gateway initialization
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle client connection
   * Authenticate via JWT in handshake
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Attach user info to socket
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
      };

      this.clientRooms.set(client.id, new Set());

      this.logger.log(
        `Client ${client.id} connected (User: ${payload.email})`,
      );

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to SEO Intelligence Platform',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Client ${client.id} authentication failed:`,
        error.message,
      );
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.forEach((room) => {
        client.leave(room);
      });
      this.clientRooms.delete(client.id);
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Subscribe to project-specific updates
   */
  @SubscribeMessage('subscribe:project')
  handleSubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;

    // TODO: Verify user has access to this project
    // const hasAccess = await this.projectService.userHasAccess(
    //   client.data.user.id,
    //   data.projectId,
    // );

    client.join(room);

    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.add(room);
    }

    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return {
      success: true,
      room,
      message: `Subscribed to project ${data.projectId}`,
    };
  }

  /**
   * Unsubscribe from project updates
   */
  @SubscribeMessage('unsubscribe:project')
  handleUnsubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);

    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.delete(room);
    }

    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);

    return {
      success: true,
      message: `Unsubscribed from project ${data.projectId}`,
    };
  }

  /**
   * Subscribe to tenant-specific updates
   */
  @SubscribeMessage('subscribe:tenant')
  handleSubscribeTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    const room = `tenant:${data.tenantId}`;

    // Verify user belongs to this tenant
    if (client.data.user.tenantId !== data.tenantId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    client.join(room);

    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.add(room);
    }

    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return {
      success: true,
      room,
      message: `Subscribed to tenant ${data.tenantId}`,
    };
  }

  /**
   * Subscribe to audit progress
   */
  @SubscribeMessage('subscribe:audit')
  handleSubscribeAudit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auditId: string },
  ) {
    const room = `audit:${data.auditId}`;
    client.join(room);

    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.add(room);
    }

    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return {
      success: true,
      room,
      message: `Subscribed to audit ${data.auditId}`,
    };
  }

  // ==========================================
  // Event Emitters (called by backend services)
  // ==========================================

  /**
   * Emit ranking update to project subscribers
   */
  emitRankingUpdate(projectId: string, ranking: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit('ranking:updated', {
      type: 'ranking.updated',
      projectId,
      ranking,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted ranking update to ${room}`);
  }

  /**
   * Emit audit progress update
   */
  emitAuditProgress(auditId: string, progress: any) {
    const room = `audit:${auditId}`;
    this.server.to(room).emit('audit:progress', {
      type: 'audit.progress',
      auditId,
      progress,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Emitted audit progress to ${room}: ${progress.percent}%`);
  }

  /**
   * Emit audit completion
   */
  emitAuditComplete(auditId: string, projectId: string, audit: any) {
    const auditRoom = `audit:${auditId}`;
    const projectRoom = `project:${projectId}`;

    const event = {
      type: 'audit.completed',
      auditId,
      projectId,
      audit,
      timestamp: new Date().toISOString(),
    };

    this.server.to(auditRoom).emit('audit:completed', event);
    this.server.to(projectRoom).emit('audit:completed', event);

    this.logger.log(`Emitted audit completion to ${auditRoom} and ${projectRoom}`);
  }

  /**
   * Emit crawl progress update
   */
  emitCrawlProgress(projectId: string, progress: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit('crawl:progress', {
      type: 'crawl.progress',
      projectId,
      progress,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Emitted crawl progress to ${room}: ${progress.pagesScanned} pages`);
  }

  /**
   * Emit backlink change notification
   */
  emitBacklinkChange(projectId: string, backlink: any, changeType: 'new' | 'lost' | 'updated') {
    const room = `project:${projectId}`;
    this.server.to(room).emit('backlink:changed', {
      type: 'backlink.changed',
      projectId,
      backlink,
      changeType,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted backlink ${changeType} to ${room}`);
  }

  /**
   * Emit general project event
   */
  emitProjectEvent(projectId: string, eventType: string, data: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit('project:event', {
      type: eventType,
      projectId,
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted ${eventType} to ${room}`);
  }

  /**
   * Emit tenant-wide notification
   */
  emitTenantNotification(tenantId: string, notification: any) {
    const room = `tenant:${tenantId}`;
    this.server.to(room).emit('tenant:notification', {
      type: 'tenant.notification',
      tenantId,
      notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted notification to ${room}`);
  }

  /**
   * Get active connections count
   */
  getActiveConnectionsCount(): number {
    return this.clientRooms.size;
  }

  /**
   * Get rooms for a specific client
   */
  getClientRooms(clientId: string): string[] {
    const rooms = this.clientRooms.get(clientId);
    return rooms ? Array.from(rooms) : [];
  }
}
