import { Box, VStack, Heading, Text, Button, SimpleGrid, Image, useToast, Spinner, Alert, AlertIcon, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { FiShoppingCart, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useProductStore } from '../stores/productStore';
import { useEffect } from 'react';
import { Product } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addToCart } = useCartStore();
  const { products, loading, error, fetchProducts, getProductsByType } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      ...product,
      quantity: 1 // Inicia com quantidade 1
    });
    
    toast({
      title: 'Item adicionado!',
      description: `${product.name} foi adicionado ao carrinho`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const renderProductGrid = (type: 'plate' | 'beverage' | 'dessert') => {
    const filteredProducts = getProductsByType(type);
    
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={4}>
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
          <Button onClick={() => window.location.reload()} colorScheme="blue">
            Tentar novamente
          </Button>
        </Box>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <Text color="gray.500">Nenhum item disponível nesta categoria.</Text>
        </Box>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {filteredProducts.map((product: Product) => (
          <Box
            key={`${product.type}-${product.id}`}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            boxShadow="md"
            _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
          >
            <Image 
              src={product.image} 
              alt={product.name} 
              w="100%" 
              h="200px" 
              objectFit="cover" 
              fallback={
                <Box 
                  w="100%" 
                  h="200px" 
                  bg="gray.100" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                >
                  <Text color="gray.500">Carregando imagem...</Text>
                </Box>
              }
            />
            <Box p={4}>
              <Heading as="h3" size="md" mb={2}>
                {product.name}
              </Heading>
              <Text color="gray.600" mb={4}>
                {product.description}
              </Text>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Text fontWeight="bold" fontSize="xl">
                  $ {product.price.toFixed(2).replace('.', ',')}
                </Text>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="green"
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                >
                  Adicionar
                </Button>
              </Box>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center" py={8}>
        <Heading as="h1" size="xl" mb={2}>
          Cardápio
        </Heading>
        <Text color="gray.600">Selecione os itens do seu pedido</Text>
      </Box>

      <Tabs variant="soft-rounded" colorScheme="blue" isLazy>
        <TabList justifyContent="center" mb={6}>
          <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Pratos</Tab>
          <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Bebidas</Tab>
          <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Sobremesas</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            {renderProductGrid('plate')}
          </TabPanel>
          <TabPanel p={0}>
            {renderProductGrid('beverage')}
          </TabPanel>
          <TabPanel p={0}>
            {renderProductGrid('dessert')}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box position="fixed" bottom={8} right={8}>
        <Button
          leftIcon={<FiShoppingCart />}
          colorScheme="blue"
          size="lg"
          onClick={() => navigate('/carrinho')}
          boxShadow="lg"
        >
          Ver Carrinho
        </Button>
      </Box>
    </VStack>
  );
};

export default HomePage;
