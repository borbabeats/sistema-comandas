import { Box, Heading, Tabs, TabList, Tab, TabPanels, TabPanel, VStack, HStack, Text, Badge, Button, useToast, Spinner, Flex } from '@chakra-ui/react';
import { FiRefreshCw, FiCheck, FiClock, FiCoffee, FiTruck } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { productService, Order } from '../services/api';

type OrderStatusType = 'pending' | 'preparing' | 'ready' | 'delivered';

type StatusConfig = {
  [key: string]: {
    label: string;
    color: string;
    nextStatus?: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
} & {
  default: {
    label: string;
    color: string;
    nextStatus?: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
  pending: {
    label: string;
    color: string;
    nextStatus: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
  preparing: {
    label: string;
    color: string;
    nextStatus: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
  ready: {
    label: string;
    color: string;
    nextStatus: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
  delivered: {
    label: string;
    color: string;
    nextStatus?: OrderStatusType;
    icon: React.ReactElement;
    buttonText: string;
    buttonColor: string;
  };
};

const statusConfig: StatusConfig = {
  // Status padrão caso o status não seja reconhecido
  default: {
    label: 'Desconhecido',
    color: 'gray',
    nextStatus: undefined,
    icon: <FiClock />,
    buttonText: 'Indisponível',
    buttonColor: 'gray'
  },
  pending: { 
    label: 'Pendente', 
    color: 'yellow', 
    nextStatus: 'preparing' as const,
    icon: <FiClock />,
    buttonText: 'Preparar',
    buttonColor: 'blue'
  },
  preparing: { 
    label: 'Em Preparo', 
    color: 'blue', 
    nextStatus: 'ready' as const,
    icon: <FiCoffee />,
    buttonText: 'Pronto para Entrega',
    buttonColor: 'green'
  },
  ready: { 
    label: 'Pronto', 
    color: 'green', 
    nextStatus: 'delivered' as const,
    icon: <FiCheck />,
    buttonText: 'Entregue',
    buttonColor: 'gray'
  },
  delivered: { 
    label: 'Entregue', 
    color: 'gray', 
    nextStatus: undefined,
    icon: <FiTruck />,
    buttonText: 'Finalizado',
    buttonColor: 'gray'
  },
};

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getOrders();
      
      // Processa os pedidos para incluir todos os itens (prato, bebida, sobremesa)
      const processedOrders = data.map(order => {
        const items: any[] = [];
        
        // Adiciona o prato se existir
        if (order.plate) {
          items.push({
            ...order.plate,
            type: 'Prato',
            quantity: 1,
            description: order.plate.description || 'Sem descrição',
            price: order.plate.price
          });
        }
        
        // Adiciona a bebida se existir
        if (order.beverage) {
          items.push({
            ...order.beverage,
            type: 'Bebida',
            quantity: 1,
            description: order.beverage.description || 'Sem descrição',
            price: order.beverage.price
          });
        }
        
        // Adiciona a sobremesa se existir
        if (order.dessert) {
          items.push({
            ...order.dessert,
            type: 'Sobremesa',
            quantity: 1,
            description: order.dessert.description || 'Sem descrição',
            price: order.dessert.price
          });
        }
        
        // Extrai o status do campo info se existir
        let status = 'pending';
        if (order.info && typeof order.info === 'string' && order.info.startsWith('status:')) {
          status = order.info.replace('status:', '').trim();
        }
        
        return {
          ...order,
          items,
          status
        };
      });
      
      setOrders(processedOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Não foi possível carregar os pedidos. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: number, currentStatus: string | undefined) => {
    if (!currentStatus) return;
    
    const statusConfigItem = getStatusConfig(currentStatus);
    const newStatus = statusConfigItem.nextStatus as OrderStatusType | undefined;
    
    if (!newStatus) return;

    try {
      await productService.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      
      const newStatusConfig = getStatusConfig(newStatus);
      toast({
        title: 'Status atualizado!',
        description: `Pedido #${orderId} marcado como ${newStatusConfig.label.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do pedido. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusConfig = (status: string | undefined) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config || statusConfig.default || statusConfig.pending;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('pt-BR', options);
  };

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Cozinha</Heading>
        <Button 
          leftIcon={<FiRefreshCw />} 
          onClick={fetchOrders}
          isLoading={isLoading}
        >
          Atualizar
        </Button>
      </Flex>

      <Tabs variant="enclosed" isLazy>
        <TabList>
          {Object.entries(statusConfig)
            .filter(([key]) => key !== 'default')
            .map(([key, { label, icon, color }]) => (
            <Tab 
              key={key}
              _selected={{ color: 'white', bg: `${color}.500` }}
            >
              <HStack spacing={2}>
                {icon}
                <Text>{label}</Text>
              </HStack>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {Object.entries(statusConfig)
            .filter(([statusKey]) => statusKey !== 'default')
            .map(([statusKey, statusConfigItem]) => {
              const filteredOrders = orders.filter(order => order.status === statusKey);
              
              return (
                <TabPanel key={statusKey} p={4}>
                  {isLoading ? (
                    <Flex justify="center" p={8}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : filteredOrders.length === 0 ? (
                    <Box textAlign="center" p={8} bg="gray.50" borderRadius="md">
                      <Text color="gray.500">Nenhum pedido {statusConfigItem.label.toLowerCase()} no momento.</Text>
                    </Box>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {filteredOrders.map((order) => (
                      <Box 
                        key={order.id}
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={4}
                        boxShadow="sm"
                      >
                        <Flex justify="space-between" mb={2}>
                          <Box>
                            <Text fontWeight="bold">Pedido #{order.id}</Text>
                            <Text fontSize="sm" color="gray.600">Cliente: {order.clientName}</Text>
                          </Box>
                          <Box textAlign="right">
                            <Text fontSize="sm" color="gray.500">
                              {formatDate(order.createdAt)}
                            </Text>
                            {(() => {
                              const status = getStatusConfig(order.status);
                              return (
                                <Badge colorScheme={status.color}>
                                  {status.label}
                                </Badge>
                              );
                            })()}
                          </Box>
                        </Flex>

                        <Box my={3}>
                          <Text fontWeight="medium" mb={1}>Itens:</Text>
                          <VStack align="stretch" spacing={3} pl={2}>
                            {order.items && order.items.map((item, index) => (
                              <Box key={index} borderWidth="1px" borderRadius="md" p={2} bg="gray.50">
                                <HStack justify="space-between" mb={1}>
                                  <Text fontWeight="medium">
                                    {item.quantity}x {item.name}
                                  </Text>
                                  <Text>$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</Text>
                                </HStack>
                                {item.description && (
                                  <Text fontSize="sm" color="gray.600" mb={1}>
                                    {item.description}
                                  </Text>
                                )}
                                {item.type && (
                                  <Badge colorScheme="blue" variant="subtle" size="sm">
                                    {item.type}
                                  </Badge>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        </Box>

                        {order.observations && (
                          <Box bg="yellow.50" p={2} borderRadius="md" mb={3}>
                            <Text fontSize="sm" fontWeight="medium">Observações:</Text>
                            <Text fontSize="sm" color="gray.700">{order.observations}</Text>
                          </Box>
                        )}

                        <Flex justify="space-between" align="center" pt={2} borderTopWidth="1px">
                          <Text fontWeight="bold">
                            Total: $ {order.items && order.items.length > 0 
                              ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2).replace('.', ',')
                              : '0,00'}
                          </Text>
                          {(() => {
                            const statusConfig = getStatusConfig(order.status);
                            return statusConfig.nextStatus ? (
                              <Button
                                size="sm"
                                colorScheme={statusConfig.buttonColor}
                                leftIcon={statusConfig.icon}
                                onClick={() => handleStatusUpdate(order.id, order.status)}
                                isLoading={isLoading}
                              >
                                {statusConfig.buttonText}
                              </Button>
                            ) : null;
                          })()}
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                  )}
                </TabPanel>
              )
            })}
          
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default KitchenPage;
