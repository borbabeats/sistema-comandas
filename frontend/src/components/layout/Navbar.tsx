import { Box, Button, Flex, Heading, Spacer, Container } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '../../stores/cartStore';

const Navbar = () => {
  const totalItems = useCartStore((state) => state.totalItems());

  return (
    <Box bg="white" shadow="sm" mb={8}>
      <Container maxW="container.xl" py={4}>
        <Flex align="center">
          <Heading size="lg" color="blue.600">
            <Box as="span" display="flex" alignItems="center">
              <FiShoppingBag style={{ marginRight: '8px' }} />
              Sistema de Comandas
            </Box>
          </Heading>
          <Spacer />
          <Button 
            as={RouterLink} 
            to="/carrinho"
            colorScheme="blue"
            variant="outline"
            leftIcon={<FiShoppingBag />}
          >
            Carrinho ({totalItems})
          </Button>
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar;