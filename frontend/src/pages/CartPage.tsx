import { Box, VStack, Heading, Text, Button, HStack, Divider, Textarea, useToast, Spinner } from '@chakra-ui/react';
import { FiTrash2, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { productService } from '../services/api';
import { useState } from 'react';

const CartPage = () => {
  const toast = useToast();
  const {
    items: cartItems,
    removeFromCart,
    updateObservations,
    totalItems,
    totalPrice,
    clearCart
  } = useCartStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de finalizar o pedido',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Solicita o nome do cliente
      const clientName = prompt('Por favor, informe o nome do cliente:');
      if (!clientName) {
        toast({
          title: 'Nome do cliente é obrigatório',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Para cada item no carrinho, cria um pedido separado
      // (o backend espera apenas um item por pedido)
      const orderPromises = cartItems.map(item => {
        const orderData: any = {
          clientName,
          isPaid: false,
          observations: item.observations || ''
        };
        
        // Define o ID correto baseado no tipo do item
        orderData[`${item.type}Id`] = item.id;
        
        return productService.createOrder(orderData);
      });

      // Aguarda todos os pedidos serem criados
      await Promise.all(orderPromises);
      
      // Limpa o carrinho após o sucesso
      clearCart();
      
      toast({
        title: 'Pedido realizado com sucesso!',
        description: 'Seu pedido foi enviado para a cozinha.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: 'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (totalItems() === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="xl" mb={4}>Seu carrinho está vazio</Text>
        <Button as={Link} to="/" colorScheme="blue">
          Ver cardápio
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Button 
            as={Link} 
            to="/" 
            leftIcon={<FiArrowLeft />} 
            variant="ghost" 
            mb={4}
          >
            Voltar ao cardápio
          </Button>
          <Heading size="lg">Seu Pedido</Heading>
        </Box>

        <Box bg="white" p={6} borderRadius="md" shadow="sm">
          <VStack spacing={4} align="stretch">
            {cartItems.map((item) => (
              <Box key={item.id}>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {item.quantity}x $ {item.price.toFixed(2)}
                    </Text>
                    {item.observations && (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={1}>
                        Obs: {item.observations}
                      </Text>
                    )}
                  </Box>
                  <Text fontWeight="bold">
                    $ {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </HStack>
                <Textarea
                  placeholder="Alguma observação adicional?"
                  size="sm"
                  rows={2}
                  mt={2}
                  value={item.observations || ''}
                  onChange={(e) => updateObservations(item.id, e.target.value)}
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  colorScheme="red" 
                  leftIcon={<FiTrash2 />}
                  mt={2}
                  onClick={() => removeFromCart(item.id)}
                >
                  Remover
                </Button>
                <Divider my={3} />
              </Box>
            ))}

            <HStack justify="space-between" mt={4}>
              <Text fontSize="lg" fontWeight="bold">
                Total:
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                $ {totalPrice().toFixed(2)}
              </Text>
            </HStack>
            <Button
              colorScheme="green"
              size="lg"
              width="100%"
              mt={6}
              rightIcon={<FiCheck />}
              onClick={handleCheckout}
            >
              {isSubmitting ? (
                <Spinner size="sm" mr={2} />
              ) : (
                'Finalizar Pedido'
              )}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CartPage;