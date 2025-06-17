import axios from 'axios';

// Interfaces
export interface OrderItem {
  id: number;
  name: string;
  type: 'plate' | 'beverage' | 'dessert' | string;
  quantity: number;
  price: number;
  description: string;
  info?: string;
  foodType?: string;
  isAlcoholic?: boolean;
  isCold?: boolean;
}

interface BaseItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
}

export interface Plate extends BaseItem {
  type: 'plate';
  foodType?: string;
}

export interface Beverage extends BaseItem {
  type: 'beverage';
  isAlcoholic?: boolean;
}

export interface Dessert extends BaseItem {
  type: 'dessert';
  isCold?: boolean;
}

export interface Order {
  id: number;
  clientName: string;
  items: OrderItem[];
  plate?: Plate;
  beverage?: Beverage;
  dessert?: Dessert;
  status?: 'pending' | 'preparing' | 'ready' | 'delivered';
  isPaid: boolean;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// Use production URL by default, with fallback to environment variable and then localhost
const baseURL = process.env.REACT_APP_API_URL || 
                'https://sistema-comandas-production.up.railway.app/api' || 
                'http://localhost:5000/api';

console.log('Using API URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000,
});

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  type: 'plate' | 'beverage' | 'dessert';
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      const [plates, beverages, desserts] = await Promise.all([
        api.get('/plates'),
        api.get('/beverages'),
        api.get('/desserts')
      ]);
      
      // Função auxiliar para normalizar o preço
      const normalizePrice = (price: any): number => {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
          // Remove caracteres não numéricos exceto ponto e vírgula
          const numericString = String(price).replace(/[^0-9,.]/g, '');
          // Substitui vírgula por ponto e converte para número
          const parsed = parseFloat(numericString.replace(',', '.'));
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Combina todos os itens em um único array, normalizando os preços
      const allProducts = [
        ...plates.data.map((item: any) => ({
          ...item,
          type: 'plate' as const,
          price: normalizePrice(item.price)
        })),
        ...beverages.data.map((item: any) => ({
          ...item,
          type: 'beverage' as const,
          price: normalizePrice(item.price)
        })),
        ...desserts.data.map((item: any) => ({
          ...item,
          type: 'dessert' as const,
          price: normalizePrice(item.price)
        }))
      ];

      return allProducts;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  async getProductById(id: number, type: 'plate' | 'beverage' | 'dessert'): Promise<Product> {
    try {
      const response = await api.get(`/${type}s/${id}`);
      return { ...response.data, type };
    } catch (error) {
      console.error(`Erro ao buscar produto ${id}:`, error);
      throw error;
    }
  },

  async createOrder(orderData: {
    clientName: string;
    plateId?: number;
    beverageId?: number;
    dessertId?: number;
    isPaid: boolean;
    observations?: string;
  }) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: number, status: 'pending' | 'preparing' | 'ready' | 'delivered'): Promise<Order> {
    try {
      const response = await api.patch(`/orders/${orderId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }
};

export default api;