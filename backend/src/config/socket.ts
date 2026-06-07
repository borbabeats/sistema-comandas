import { Server as SocketIOServer } from 'socket.io';
import { logInfo, logError } from './logger';

export interface OrderSocketData {
  orderId: string;
  clientName: string;
  items: {
    plate?: { name: string; price: number };
    beverage?: { name: string; price: number };
    dessert?: { name: string; price: number };
  };
  total: number;
  isPaid: boolean;
  createdAt: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export interface KitchenUpdateData {
  orderId: string;
  status: 'preparing' | 'ready' | 'delivered';
  updatedAt: string;
  updatedBy?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Set<string> = new Set();

  initialize(server: any) {
    try {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            process.env.CLOUDFRONT_DOMAIN || 'https://*.cloudfront.net',
            'http://localhost:3000',
            'http://localhost:3001'
          ],
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventHandlers();
      logInfo('Socket.IO server initialized successfully');
    } catch (error) {
      logError('Failed to initialize Socket.IO server', error as Error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      this.connectedClients.add(clientId);
      
      logInfo('Client connected to WebSocket', {
        clientId,
        totalClients: this.connectedClients.size,
        userAgent: socket.handshake.headers['user-agent']
      });

      // Handle kitchen connection
      socket.on('join-kitchen', () => {
        socket.join('kitchen');
        logInfo('Client joined kitchen room', { clientId });
        
        // Notify kitchen about new connection
        socket.to('kitchen').emit('kitchen-staff-updated', {
          totalStaff: this.io?.sockets.adapter.rooms.get('kitchen')?.size || 0
        });
      });

      // Handle order status updates
      socket.on('update-order-status', (data: KitchenUpdateData) => {
        logInfo('Order status update received', { 
          clientId, 
          orderId: data.orderId, 
          newStatus: data.status 
        });

        // Broadcast to all kitchen staff
        this.io?.to('kitchen').emit('order-status-updated', data);
        
        // Also broadcast to all connected clients (for real-time updates)
        this.io?.emit('order-status-updated', data);
      });

      // Handle new orders
      socket.on('new-order', (orderData: OrderSocketData) => {
        logInfo('New order received', {
          clientId,
          orderId: orderData.orderId,
          clientName: orderData.clientName,
          total: orderData.total
        });

        // Broadcast to kitchen staff
        this.io?.to('kitchen').emit('new-order', orderData);
        
        // Broadcast to all clients for real-time updates
        this.io?.emit('new-order', orderData);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(clientId);
        
        logInfo('Client disconnected from WebSocket', {
          clientId,
          reason,
          totalClients: this.connectedClients.size
        });

        // Notify kitchen about disconnection
        socket.to('kitchen').emit('kitchen-staff-updated', {
          totalStaff: this.io?.sockets.adapter.rooms.get('kitchen')?.size || 0
        });
      });

      // Handle kitchen status requests
      socket.on('get-kitchen-status', () => {
        const kitchenStaff = this.io?.sockets.adapter.rooms.get('kitchen')?.size || 0;
        socket.emit('kitchen-status', {
          totalStaff: kitchenStaff,
          connectedClients: this.connectedClients.size
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        logError('Socket error occurred', error as Error, { clientId });
      });
    });
  }

  // Method to broadcast new order (called from order creation)
  broadcastNewOrder(orderData: OrderSocketData) {
    if (!this.io) {
      logError('Socket.IO not initialized, cannot broadcast order');
      return;
    }

    try {
      this.io.to('kitchen').emit('new-order', orderData);
      this.io.emit('new-order', orderData);
      
      logInfo('New order broadcasted successfully', {
        orderId: orderData.orderId,
        kitchenStaff: this.io.sockets.adapter.rooms.get('kitchen')?.size || 0,
        totalClients: this.connectedClients.size
      });
    } catch (error) {
      logError('Failed to broadcast new order', error as Error, {
        orderId: orderData.orderId
      });
    }
  }

  // Method to broadcast order status update
  broadcastOrderStatusUpdate(data: KitchenUpdateData) {
    if (!this.io) {
      logError('Socket.IO not initialized, cannot broadcast status update');
      return;
    }

    try {
      this.io.to('kitchen').emit('order-status-updated', data);
      this.io.emit('order-status-updated', data);
      
      logInfo('Order status update broadcasted successfully', {
        orderId: data.orderId,
        newStatus: data.status,
        kitchenStaff: this.io.sockets.adapter.rooms.get('kitchen')?.size || 0
      });
    } catch (error) {
      logError('Failed to broadcast order status update', error as Error, {
        orderId: data.orderId,
        status: data.status
      });
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      connectedClients: this.connectedClients.size,
      kitchenStaff: this.io?.sockets.adapter.rooms.get('kitchen')?.size || 0,
      isInitialized: !!this.io
    };
  }

  // Close all connections
  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connectedClients.clear();
      logInfo('Socket.IO server closed');
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
