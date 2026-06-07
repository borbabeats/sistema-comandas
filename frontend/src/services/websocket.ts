import { io, Socket } from 'socket.io-client';

// Interfaces para eventos WebSocket
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

export interface KitchenStatus {
  totalStaff: number;
  connectedClients: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private newOrderListeners: ((order: OrderSocketData) => void)[] = [];
  private orderStatusListeners: ((data: KitchenUpdateData) => void)[] = [];
  private kitchenStatusListeners: ((status: KitchenStatus) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];

  constructor() {
    // Configurar URL do WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    
    console.log('WebSocket URL:', wsUrl);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('WebSocket conectado com sucesso');
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket desconectado:', reason);
        this.notifyConnectionListeners(false);
        
        // Tentar reconectar automaticamente
        if (reason === 'io server disconnect') {
          // Server iniciou desconexão, tentar reconectar
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erro de conexão WebSocket:', error);
        this.notifyErrorListeners(error);
        this.handleReconnect();
        reject(error);
      });

      // Eventos de pedidos
      this.socket.on('new-order', (order: OrderSocketData) => {
        console.log('Novo pedido recebido:', order);
        this.notifyNewOrderListeners(order);
      });

      this.socket.on('order-status-updated', (data: KitchenUpdateData) => {
        console.log('Status do pedido atualizado:', data);
        this.notifyOrderStatusListeners(data);
      });

      // Eventos da cozinha
      this.socket.on('kitchen-status', (status: KitchenStatus) => {
        console.log('Status da cozinha:', status);
        this.notifyKitchenStatusListeners(status);
      });

      this.socket.on('kitchen-staff-updated', (data: { totalStaff: number }) => {
        console.log('Staff da cozinha atualizado:', data);
        this.notifyKitchenStatusListeners({
          totalStaff: data.totalStaff,
          connectedClients: this.socket?.connected ? 1 : 0
        });
      });

      this.socket.on('error', (error) => {
        console.error('Erro WebSocket:', error);
        this.notifyErrorListeners(error);
      });
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Número máximo de tentativas de reconexão atingido');
    }
  }

  // Métodos para entrar/sair de salas
  joinKitchen(): void {
    if (this.socket?.connected) {
      this.socket.emit('join-kitchen');
      console.log('Entrou na sala da cozinha');
    }
  }

  leaveKitchen(): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-kitchen');
      console.log('Saiu da sala da cozinha');
    }
  }

  // Métodos para enviar eventos
  updateOrderStatus(data: KitchenUpdateData): void {
    if (this.socket?.connected) {
      this.socket.emit('update-order-status', data);
    }
  }

  getKitchenStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-kitchen-status');
    }
  }

  // Métodos para adicionar/remover listeners
  onNewOrder(listener: (order: OrderSocketData) => void): () => void {
    this.newOrderListeners.push(listener);
    return () => {
      const index = this.newOrderListeners.indexOf(listener);
      if (index > -1) {
        this.newOrderListeners.splice(index, 1);
      }
    };
  }

  onOrderStatusUpdate(listener: (data: KitchenUpdateData) => void): () => void {
    this.orderStatusListeners.push(listener);
    return () => {
      const index = this.orderStatusListeners.indexOf(listener);
      if (index > -1) {
        this.orderStatusListeners.splice(index, 1);
      }
    };
  }

  onKitchenStatus(listener: (status: KitchenStatus) => void): () => void {
    this.kitchenStatusListeners.push(listener);
    return () => {
      const index = this.kitchenStatusListeners.indexOf(listener);
      if (index > -1) {
        this.kitchenStatusListeners.splice(index, 1);
      }
    };
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Métodos privados para notificar listeners
  private notifyNewOrderListeners(order: OrderSocketData): void {
    this.newOrderListeners.forEach(listener => {
      try {
        listener(order);
      } catch (error) {
        console.error('Erro no listener de new-order:', error);
      }
    });
  }

  private notifyOrderStatusListeners(data: KitchenUpdateData): void {
    this.orderStatusListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Erro no listener de order-status-updated:', error);
      }
    });
  }

  private notifyKitchenStatusListeners(status: KitchenStatus): void {
    this.kitchenStatusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erro no listener de kitchen-status:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Erro no listener de connection:', error);
      }
    });
  }

  private notifyErrorListeners(error: Error): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Erro no listener de error:', err);
      }
    });
  }

  // Métodos utilitários
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStats(): { connected: boolean; socketId?: string } {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Resetar estado
  reset(): void {
    this.disconnect();
    this.newOrderListeners = [];
    this.orderStatusListeners = [];
    this.kitchenStatusListeners = [];
    this.connectionListeners = [];
    this.errorListeners = [];
    this.reconnectAttempts = 0;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Hook React para usar WebSocket
export const useWebSocket = () => {
  const connect = () => websocketService.connect();
  const disconnect = () => websocketService.disconnect();
  const isConnected = () => websocketService.isConnected();
  
  const joinKitchen = () => websocketService.joinKitchen();
  const leaveKitchen = () => websocketService.leaveKitchen();
  const updateOrderStatus = (data: KitchenUpdateData) => websocketService.updateOrderStatus(data);
  const getKitchenStatus = () => websocketService.getKitchenStatus();
  
  const onNewOrder = (listener: (order: OrderSocketData) => void) => websocketService.onNewOrder(listener);
  const onOrderStatusUpdate = (listener: (data: KitchenUpdateData) => void) => websocketService.onOrderStatusUpdate(listener);
  const onKitchenStatus = (listener: (status: KitchenStatus) => void) => websocketService.onKitchenStatus(listener);
  const onConnectionChange = (listener: (connected: boolean) => void) => websocketService.onConnectionChange(listener);
  const onError = (listener: (error: Error) => void) => websocketService.onError(listener);
  
  return {
    connect,
    disconnect,
    isConnected,
    joinKitchen,
    leaveKitchen,
    updateOrderStatus,
    getKitchenStatus,
    onNewOrder,
    onOrderStatusUpdate,
    onKitchenStatus,
    onConnectionChange,
    onError
  };
};
