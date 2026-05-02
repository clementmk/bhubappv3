import { REACT_APP_WS_BASE_URL } from '@env';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket.IO server configuration
// Environment detection for different platforms:
// 1. If running on Android emulator: 10.0.2.2:3001
// 2. If running on iOS simulator: localhost:3001
// 3. If running on physical device: use your PC's local IP (e.g., 192.168.x.x)
//
// CHANGE THIS to your local PC IP address or backend URL:
const WS_BASE_URL = REACT_APP_WS_BASE_URL;
// For physical device on WiFi, replace above with: 'http://YOUR_PC_IP:3001'
// Example: 'http://192.168.1.100:3001'

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

export interface WebSocketHook {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
}

// Socket.IO service class (drop-in replacement for the old raw WebSocket service)
class WebSocketService {
  private socket: Socket | null = null;
  private listeners: ((message: WebSocketMessage) => void)[] = [];

  connect(userId?: string): Promise<void> {
    // If already connected with same socket, resolve immediately
    if (this.socket?.connected) {
      if (userId) this.socket.emit('join', userId);
      return Promise.resolve();
    }

    // Tear down any stale socket before creating a new one
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_BASE_URL, {
          // Try WebSocket first, fallback to HTTP long-polling if WebSocket fails
          // This matches the Socket.IO "Reliable" feature from Lecture 5B
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
          query: userId ? { userId } : {},
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connected:', this.socket?.id);

          // If a userId was provided, join the user's personal room
          if (userId) {
            this.socket?.emit('join', userId);
          }

          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error.message);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        // Forward all incoming events as WebSocketMessage objects to listeners
        this.socket.onAny((event: string, data: any) => {
          const message: WebSocketMessage = {
            type: event,
            payload: data,
            timestamp: Date.now(),
          };
          this.listeners.forEach(listener => listener(message));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.socket?.connected) {
      this.socket.emit(message.type, message.payload);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  addListener(listener: (message: WebSocketMessage) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (message: WebSocketMessage) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
}

// Singleton instance
const wsService = new WebSocketService();

// React hook for using WebSocket (same API as before — no changes needed in consuming components)
export const useWebSocket = (userId?: string): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messageHandlerRef = useRef<((message: WebSocketMessage) => void) | null>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        setConnectionError(null);
        await wsService.connect(userId);
        setIsConnected(true);
      } catch (error) {
        setConnectionError('Failed to connect to server');
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Set up message listener
    messageHandlerRef.current = (message: WebSocketMessage) => {
      setLastMessage(message);
    };

    if (messageHandlerRef.current) {
      wsService.addListener(messageHandlerRef.current);
    }

    // Cleanup on unmount — remove listener and disconnect
    return () => {
      if (messageHandlerRef.current) {
        wsService.removeListener(messageHandlerRef.current);
      }
      wsService.disconnect();
    };
  }, [userId]);

  const sendMessage = (message: WebSocketMessage) => {
    wsService.send(message);
  };

  return {
    isConnected,
    sendMessage,
    lastMessage,
    connectionError,
  };
};

// WebSocket event types (unchanged — all consumers can keep using these)
export const WS_EVENTS = {
  // User events
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_UPDATED: 'user_updated',

  // Route events
  ROUTE_COMPLETED: 'route_completed',
  ROUTE_ADDED: 'route_added',
  ROUTE_UPDATED: 'route_updated',

  // Beta events
  BETA_UPLOADED: 'beta_uploaded',

  // Community events
  POST_CREATED: 'post_created',

  // Leaderboard events
  LEADERBOARD_UPDATED: 'leaderboard_updated',
} as const;

// Helper functions for common WebSocket operations (unchanged)
export const wsHelpers = {
  // Send route completion notification
  notifyRouteCompletion: (routeId: number, username: string, grade: string) => ({
    type: WS_EVENTS.ROUTE_COMPLETED,
    payload: { routeId, username, grade, timestamp: Date.now() },
  }),

  // Send new post notification
  notifyNewPost: (postId: string, username: string, content: string) => ({
    type: WS_EVENTS.POST_CREATED,
    payload: { postId, username, content: content.substring(0, 100), timestamp: Date.now() },
  }),
};

export default wsService;