import { Box, Container, VStack } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import KitchenPage from './pages/KitchenPage';

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/cozinha" element={<KitchenPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </VStack>
      </Container>
    </Box>
  );
}

export default App;