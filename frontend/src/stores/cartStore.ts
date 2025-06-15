import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Product } from '../services/api';

export type CartItem = Omit<Product, 'description'> & {
  quantity: number;
  observations?: string;
};

type CartStore = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  updateObservations: (itemId: number, observations: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
              ),
            };
          }
          
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      
      removeFromCart: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },
      
      updateObservations: (itemId, observations) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, observations } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      totalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        );
      },
    }),
    {
      name: 'cart-storage', // Nome da chave no localStorage
    }
  )
);