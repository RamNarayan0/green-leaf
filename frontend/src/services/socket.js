/**
 * Socket.io Service
 * Handles real-time communication for delivery tracking
 */

import { io } from 'socket.io-client';

// In dev, use an empty string so socket goes through Vite's /socket.io proxy → port 5003.
// In production, use the explicit VITE_SOCKET_URL env var.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(token) {
    if (!token) {
      console.log('Socket connect skipped: No token provided');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.isConnected = true; // Keep this to reflect connection status
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        this.isConnected = false; // Set to false if server initiated disconnect
      }
      this.isConnected = false; // Also set to false for other disconnect reasons
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('delivery-location-update', (data) => {
      this.emit('delivery-update', data);
    });

    this.socket.on('order-status-update', (data) => {
      this.emit('order-status', data);
    });

    this.socket.on('delivery-partner-assigned', (data) => {
      this.emit('partner-assigned', data);
    });

    this.socket.on('delivery-completed', (data) => {
      this.emit('delivery-done', data);
    });

    this.socket.on('eta-update', (data) => {
      this.emit('eta-update', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  joinOrderRoom(orderId) {
    this.socket?.emit('join-order', { orderId });
  }

  leaveOrderRoom(orderId) {
    this.socket?.emit('leave-order', { orderId });
  }

  updateLocation(orderId, latitude, longitude) {
    this.socket?.emit('update-location', {
      orderId,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getSocket() {
    return this.socket;
  }

  joinRoom(roomName) {
    if (this.socket) {
      this.socket.emit('join-room', roomName);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;

