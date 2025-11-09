import { useEffect, useState, useCallback, useRef } from 'react';
import {
  WebSocketService,
  getWebSocketService,
  WebSocketEventType,
  ConnectionState,
  RankingUpdateEvent,
  KeywordDiscoveredEvent,
  CompetitorChangeEvent,
  BacklinkEvent,
  SyncEvent,
  AlertEvent,
} from '../services/websocket/WebSocketService';

// Hook options
export interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  debug?: boolean;
}

// Hook return type
export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  send: (type: WebSocketEventType, data: any) => void;
  subscribe: (events: string[]) => void;
  unsubscribe: (events: string[]) => void;
}

// Main WebSocket hook
export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Initialize WebSocket service
    wsRef.current = getWebSocketService({
      url: options.url,
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 1000,
      debug: options.debug ?? false,
    });

    // Setup event listeners
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionState(ConnectionState.CONNECTED);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    const handleReconnecting = () => {
      setConnectionState(ConnectionState.RECONNECTING);
    };

    wsRef.current.on(WebSocketEventType.CONNECTED, handleConnected);
    wsRef.current.on(WebSocketEventType.DISCONNECTED, handleDisconnected);
    wsRef.current.on(WebSocketEventType.RECONNECTING, handleReconnecting);

    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      wsRef.current.connect();
    }

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.off(WebSocketEventType.CONNECTED, handleConnected);
        wsRef.current.off(WebSocketEventType.DISCONNECTED, handleDisconnected);
        wsRef.current.off(WebSocketEventType.RECONNECTING, handleReconnecting);
        wsRef.current.disconnect();
      }
    };
  }, [options.url, options.autoConnect, options.reconnect, options.reconnectInterval, options.debug]);

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  const send = useCallback((type: WebSocketEventType, data: any) => {
    wsRef.current?.send(type, data);
  }, []);

  const subscribe = useCallback((events: string[]) => {
    wsRef.current?.subscribe(events);
  }, []);

  const unsubscribe = useCallback((events: string[]) => {
    wsRef.current?.unsubscribe(events);
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
};

// Hook for specific event types
export const useWebSocketEvent = <T = any>(
  eventType: WebSocketEventType,
  handler: (data: T) => void,
  dependencies: any[] = []
) => {
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    wsRef.current = getWebSocketService();

    const eventHandler = (data: T) => {
      handler(data);
    };

    wsRef.current.on(eventType, eventHandler);

    return () => {
      wsRef.current?.off(eventType, eventHandler);
    };
  }, [eventType, ...dependencies]);
};

// Hook for ranking updates
export const useRankingUpdates = (handler: (data: RankingUpdateEvent) => void) => {
  useWebSocketEvent<RankingUpdateEvent>(WebSocketEventType.RANKING_UPDATE, handler);
};

// Hook for keyword discoveries
export const useKeywordDiscoveries = (handler: (data: KeywordDiscoveredEvent) => void) => {
  useWebSocketEvent<KeywordDiscoveredEvent>(WebSocketEventType.KEYWORD_DISCOVERED, handler);
};

// Hook for competitor changes
export const useCompetitorChanges = (handler: (data: CompetitorChangeEvent) => void) => {
  useWebSocketEvent<CompetitorChangeEvent>(WebSocketEventType.COMPETITOR_CHANGE, handler);
};

// Hook for backlink events
export const useBacklinkEvents = (
  onAdded: (data: BacklinkEvent) => void,
  onLost: (data: BacklinkEvent) => void
) => {
  useWebSocketEvent<BacklinkEvent>(WebSocketEventType.BACKLINK_ADDED, onAdded);
  useWebSocketEvent<BacklinkEvent>(WebSocketEventType.BACKLINK_LOST, onLost);
};

// Hook for sync events
export const useSyncEvents = (handler: (data: SyncEvent) => void) => {
  useWebSocketEvent<SyncEvent>(WebSocketEventType.SYNC_STARTED, handler);
  useWebSocketEvent<SyncEvent>(WebSocketEventType.SYNC_COMPLETED, handler);
  useWebSocketEvent<SyncEvent>(WebSocketEventType.SYNC_FAILED, handler);
};

// Hook for alerts
export const useAlerts = (handler: (data: AlertEvent) => void) => {
  useWebSocketEvent<AlertEvent>(WebSocketEventType.ALERT_TRIGGERED, handler);
};

// Hook for real-time notifications with state management
export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<AlertEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleAlert = useCallback((alert: AlertEvent) => {
    setNotifications((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);
  }, []);

  useAlerts(handleAlert);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((alertId: string) => {
    setNotifications((prev) => prev.filter((n) => n.alertId !== alertId));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification,
  };
};

// Hook for real-time data updates with automatic re-rendering
export const useRealtimeData = <T extends { id: string }>(
  initialData: T[],
  eventType: WebSocketEventType,
  updateStrategy: 'merge' | 'replace' | 'append' = 'merge'
) => {
  const [data, setData] = useState<T[]>(initialData);

  const handleUpdate = useCallback(
    (update: T | T[]) => {
      const updates = Array.isArray(update) ? update : [update];

      setData((prevData) => {
        switch (updateStrategy) {
          case 'replace':
            return updates;

          case 'append':
            return [...prevData, ...updates];

          case 'merge':
          default:
            const updatedData = [...prevData];
            updates.forEach((newItem) => {
              const index = updatedData.findIndex((item) => item.id === newItem.id);
              if (index >= 0) {
                updatedData[index] = { ...updatedData[index], ...newItem };
              } else {
                updatedData.push(newItem);
              }
            });
            return updatedData;
        }
      });
    },
    [updateStrategy]
  );

  useWebSocketEvent(eventType, handleUpdate);

  return data;
};

export default useWebSocket;
