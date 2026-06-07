import { create } from 'zustand';
import { productService, Product } from '../services/api';

type ProductType = 'plate' | 'beverage' | 'dessert';

type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductsByType: (type: ProductType) => Product[];
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productService.getProducts();
      set({ products, loading: false });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      set({ 
        error: 'Erro ao carregar os produtos. Tente novamente mais tarde.',
        loading: false 
      });
    }
  },

  getProductsByType: (type: ProductType) => {
    // Filtra os produtos pelo tipo especificado
    return get().products.filter((product: Product) => product.type === type);
  },
}));
