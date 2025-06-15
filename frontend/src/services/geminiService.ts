// Imagens de fallback por categoria
const FALLBACK_IMAGES: Record<string, string[]> = {
  plate: [
    'https://images.unsplash.com/photo-1504674900247-087c1f6b77ce?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790c45?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop'
  ],
  beverage: [
    'https://images.unsplash.com/photo-1514362544707-bd33de934af5?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fb?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1514361892635-6b07e31f731a?w=300&h=200&fit=crop'
  ],
  dessert: [
    'https://images.unsplash.com/photo-1551024601-bec78aea704c?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300&h=200&fit=crop'
  ]
};

// Função para obter uma imagem aleatória do array
const getRandomImage = (type: string): string => {
  const images = FALLBACK_IMAGES[type] || FALLBACK_IMAGES.plate;
  return images[Math.floor(Math.random() * images.length)];
};

export const generateProductImage = async (_productName: string, productType: string): Promise<string> => {
  // Usa uma imagem aleatória do tipo específico como fallback
  return getRandomImage(productType);
}
