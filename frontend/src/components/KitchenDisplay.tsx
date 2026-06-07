import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  useToast,
  IconButton
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  TimeIcon, 
  WarningIcon,
  CloseIcon 
} from '@chakra-ui/icons';
import { useWebSocket, OrderSocketData, KitchenUpdateData, KitchenStatus } from '../services/websocket';

interface OrderDisplay extends OrderSocketData {
  receivedAt: string;
}

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();
  const {
    connect,
    disconnect,
    joinKitchen,
    leaveKitchen,
    updateOrderStatus,
    onNewOrder,
    onOrderStatusUpdate,
    onKitchenStatus,
    onConnectionChange,
    onError
  } = useWebSocket();

  // Conectar WebSocket ao montar componente
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        setLoading(true);
        await connect();
        joinKitchen();
        getKitchenStatus();
      } catch (err) {
        console.error('Falha ao conectar WebSocket:', err);
        setError('Falha ao conectar com o servidor de pedidos');
      } finally {
        setLoading(false);
      }
    };

    initWebSocket();

    // Cleanup ao desmontar
    return () => {
      leaveKitchen();
      disconnect();
    };
  }, []);

  // Setup listeners
  useEffect(() => {
    const unsubscribeNewOrder = onNewOrder((order: OrderSocketData) => {
      const newOrder: OrderDisplay = {
        ...order,
        receivedAt: new Date().toISOString()
      };
      
      setOrders(prev => [newOrder, ...prev]);
      
      toast({
        title: 'Novo Pedido!',
        description: `Pedido #${order.orderId.slice(-6)} para ${order.clientName}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    });

    const unsubscribeStatusUpdate = onOrderStatusUpdate((data: KitchenUpdateData) => {
      setOrders(prev => prev.map(order => 
        order.orderId === data.orderId 
          ? { ...order, status: data.status }
          : order
      ));

      toast({
        title: 'Status Atualizado',
        description: `Pedido #${data.orderId.slice(-6)} agora está ${getStatusText(data.status)}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    });

    const unsubscribeKitchenStatus = onKitchenStatus((status: KitchenStatus) => {
      setKitchenStatus(status);
    });

    const unsubscribeConnectionChange = onConnectionChange((connected: boolean) => {
      setIsConnected(connected);
      if (!connected) {
        setError('Conexão perdida com o servidor');
      } else {
        setError(null);
      }
    });

    const unsubscribeError = onError((err: Error) => {
      setError(err.message);
    });

    return () => {
      unsubscribeNewOrder();
      unsubscribeStatusUpdate();
      unsubscribeKitchenStatus();
      unsubscribeConnectionChange();
      unsubscribeError();
    };
  }, [toast, onNewOrder, onOrderStatusUpdate, onKitchenStatus, onConnectionChange, onError]);

  const getKitchenStatus = () => {
    // Implementar chamada para obter status atual
    // Isso poderia ser uma chamada HTTP para /api/socket/stats
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'preparing': return 'blue';
      case 'ready': return 'green';
      case 'delivered': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <TimeIcon />;
      case 'preparing': return <Spinner size="sm" />;
      case 'ready': return <CheckCircleIcon />;
      case 'delivered': return <CheckCircleIcon />;
      default: return <WarningIcon />;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'preparing' | 'ready' | 'delivered') => {
    try {
      updateOrderStatus({
        orderId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente',
        status: 'error',
        duration: 3000
      });
    }
  };

  const removeOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.orderId !== orderId));
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando cozinha...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      {/* Header */}
      <VStack spacing={4} mb={8}>
        <Heading size="2xl" color="teal.600">
          Cozinha - Sistema de Comandas
        </Heading>
        
        {/* Status da Conexão */}
        <HStack spacing={4}>
          <Badge colorScheme={isConnected ? 'green' : 'red'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          
          {kitchenStatus && (
            <>
              <Badge colorScheme="blue">
                Staff: {kitchenStatus.totalStaff}
              </Badge>
              <Badge colorScheme="purple">
                Clientes: {kitchenStatus.connectedClients}
              </Badge>
            </>
          )}
        </HStack>

        {/* Alertas */}
        {error && (
          <Alert status="warning">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!isConnected && (
          <Alert status="error">
            <AlertIcon />
            Sem conexão com o servidor. Pedidos em tempo real não funcionarão.
          </Alert>
        )}
      </VStack>

      {/* Contadores */}
      <HStack spacing={4} mb={6}>
        <Card flex={1}>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
              {getOrdersByStatus('pending').length}
            </Text>
            <Text>Aguardando</Text>
          </CardBody>
        </Card>
        
        <Card flex={1}>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {getOrdersByStatus('preparing').length}
            </Text>
            <Text>Preparando</Text>
          </CardBody>
        </Card>
        
        <Card flex={1}>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {getOrdersByStatus('ready').length}
            </Text>
            <Text>Prontos</Text>
          </CardBody>
        </Card>
      </HStack>

      {/* Lista de Pedidos */}
      <VStack spacing={4} align="stretch">
        {orders.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500">Nenhum pedido no momento</Text>
            </CardBody>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.orderId} borderWidth={2} borderColor="gray.200">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {/* Header do Pedido */}
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        #{order.orderId.slice(-6)}
                      </Text>
                      <Text color="gray.600">
                        {order.clientName}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {formatTime(order.createdAt)}
                      </Text>
                    </VStack>
                    
                    <HStack spacing={2}>
                      <Badge colorScheme={getStatusColor(order.status)}>
                        <HStack spacing={1}>
                          {getStatusIcon(order.status)}
                          <Text>{getStatusText(order.status)}</Text>
                        </HStack>
                      </Badge>
                      
                      <IconButton
                        aria-label="Remover pedido"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeOrder(order.orderId)}
                      />
                    </HStack>
                  </HStack>

                  {/* Itens do Pedido */}
                  <VStack align="start" spacing={1}>
                    {order.items.plate && (
                      <Text>
                        <strong>Prato:</strong> {order.items.plate.name}
                      </Text>
                    )}
                    {order.items.beverage && (
                      <Text>
                        <strong>Bebida:</strong> {order.items.beverage.name}
                      </Text>
                    )}
                    {order.items.dessert && (
                      <Text>
                        <strong>Sobremesa:</strong> {order.items.dessert.name}
                      </Text>
                    )}
                  </VStack>

                  {/* Total e Ações */}
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="lg">
                      Total: {formatCurrency(order.total)}
                    </Text>
                    
                    {/* Botões de Ação */}
                    <HStack spacing={2}>
                      {order.status === 'pending' && (
                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, 'preparing')}
                        >
                          Iniciar Preparo
                        </Button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <Button
                          colorScheme="green"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, 'ready')}
                        >
                          Marcar como Pronto
                        </Button>
                      )}
                      
                      {order.status === 'ready' && (
                        <Button
                          colorScheme="teal"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, 'delivered')}
                        >
                          Entregar
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default KitchenDisplay;
