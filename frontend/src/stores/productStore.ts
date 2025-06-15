import { create } from 'zustand';
import { productService, Product } from '../services/api';
import { generateProductImage } from '../services/geminiService';

// Função auxiliar para garantir que sempre temos uma imagem
const ensureImage = async (product: Product): Promise<Product> => {
  if (product.image) return product;
  
  try {
    const imageUrl = await generateProductImage(product.name, product.type);
    return { ...product, image: imageUrl };
  } catch (error) {
    console.error(`Erro ao gerar imagem para ${product.name}:`, error);
    return product; // Retorna o produto sem imagem, o fallback será tratado no componente
  }
};

type ProductType = 'plate' | 'beverage' | 'dessert';

type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductsByType: (type: ProductType) => Product[];
  // generateProductImages foi removido, usando ensureImage diretamente
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productService.getProducts();
      // Garante que todos os produtos tenham imagens
      const productsWithImages = await Promise.all(products.map(ensureImage));
      set({ products: productsWithImages, loading: false });
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
