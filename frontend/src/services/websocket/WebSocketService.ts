import { EventEmitter } from 'events';

// Event types
export enum WebSocketEventType {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',

  // Data events
  RANKING_UPDATE = 'ranking_update',
  KEYWORD_DISCOVERED = 'keyword_discovered',
  COMPETITOR_CHANGE = 'competitor_change',
  BACKLINK_ADDED = 'backlink_added',
  BACKLINK_LOST = 'backlink_lost',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  ALERT_TRIGGERED = 'alert_triggered',
  REPORT_GENERATED = 'report_generated',

  // System events
  HEARTBEAT = 'heartbeat',
  MESSAGE = 'message',
}

// Message interfaces
export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: number;
  id?: string;
}

export interface RankingUpdateEvent {
  keywordId: string;
  keyword: string;
  oldPosition: number;
  newPosition: number;
  change: number;
  url: string;
  searchEngine: string;
  location: string;
}

export interface KeywordDiscoveredEvent {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunity: number;
  intent: string;
}

export interface CompetitorChangeEvent {
  competitorId: string;
  domain: string;
  metric: string;
  oldValue: number;
  newValue: number;
  change: number;
}

export interface BacklinkEvent {
  backlinkId: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  isDoFollow: boolean;
}

export interface SyncEvent {
  syncId: string;
  integration: string;
  operation: string;
  status: 'started' | 'completed' | 'failed';
  recordsProcessed?: number;
  error?: string;
}

export interface AlertEvent {
  alertId: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: any;
}

// Connection options
export interface WebSocketOptions {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

// Connection state
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

// WebSocket Service
export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private lastHeartbeat: number = 0;

  constructor(options: WebSocketOptions) {
    super();
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      reconnectDecay: 1.5,
      maxReconnectInterval: 30000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: false,
      ...options,
    };
  }

  // Connect to WebSocket server
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);
    this.log('Connecting to WebSocket server...');

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error);
    }
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    this.log('Disconnecting from WebSocket server...');
    this.options.reconnect = false;
    this.clearTimers();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  // Send message to server
  public send(type: WebSocketEventType, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateId(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message:', message);
    } else {
      this.log('WebSocket not connected, queuing message');
      this.messageQueue.push(message);
    }
  }

  // Subscribe to specific events
  public subscribe(eventTypes: string[]): void {
    eventTypes.forEach((type) => this.subscriptions.add(type));

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(WebSocketEventType.MESSAGE, {
        action: 'subscribe',
        events: eventTypes,
      });
    }
  }

  // Unsubscribe from events
  public unsubscribe(eventTypes: string[]): void {
    eventTypes.forEach((type) => this.subscriptions.delete(type));

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(WebSocketEventType.MESSAGE, {
        action: 'unsubscribe',
        events: eventTypes,
      });
    }
  }

  // Get connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Check if connected
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  // Handle connection opened
  private handleOpen(): void {
    this.log('WebSocket connected');
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    this.emit(WebSocketEventType.CONNECTED);

    // Process queued messages
    this.processMessageQueue();

    // Resubscribe to events
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }

    // Start heartbeat
    this.startHeartbeat();
  }

  // Handle incoming message
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Received message:', message);

      // Update last heartbeat
      if (message.type === WebSocketEventType.HEARTBEAT) {
        this.lastHeartbeat = Date.now();
        return;
      }

      // Emit specific event
      this.emit(message.type, message.data);

      // Emit general message event
      this.emit(WebSocketEventType.MESSAGE, message);
    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  // Handle WebSocket error
  private handleError(error: any): void {
    this.log('WebSocket error:', error);
    this.emit(WebSocketEventType.ERROR, error);
  }

  // Handle connection closed
  private handleClose(event: CloseEvent): void {
    this.log('WebSocket closed:', event.code, event.reason);
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.emit(WebSocketEventType.DISCONNECTED, {
      code: event.code,
      reason: event.reason,
    });

    this.clearTimers();

    // Attempt reconnection if enabled
    if (
      this.options.reconnect &&
      this.reconnectAttempts < this.options.maxReconnectAttempts
    ) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setConnectionState(ConnectionState.FAILED);
      this.log('Max reconnection attempts reached');
    }
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.reconnectAttempts - 1),
      this.options.maxReconnectInterval
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    this.emit(WebSocketEventType.RECONNECTING, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.options.maxReconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Process queued messages
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log(`Processing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.lastHeartbeat = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(WebSocketEventType.HEARTBEAT, { timestamp: Date.now() });

        // Check if we've received a heartbeat recently
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
        if (timeSinceLastHeartbeat > this.options.heartbeatInterval * 2) {
          this.log('Heartbeat timeout, reconnecting...');
          this.ws.close(1000, 'Heartbeat timeout');
        }
      }
    }, this.options.heartbeatInterval);
  }

  // Clear timers
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Set connection state
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.log(`Connection state: ${state}`);
  }

  // Generate unique message ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log message
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export const getWebSocketService = (options?: WebSocketOptions): WebSocketService => {
  if (!wsService && options) {
    wsService = new WebSocketService(options);
  } else if (!wsService) {
    throw new Error('WebSocketService not initialized. Provide options on first call.');
  }
  return wsService;
};

export default WebSocketService;
