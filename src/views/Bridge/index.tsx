import React, { useEffect, useState, useMemo } from 'react';
import { DotLoader } from 'react-spinners';

import {
  Container,
  Center,
  Flex,
  Box,
  Heading,
  List,
  VStack,
  Icon,
  Button,
  Text,
  HStack,
  Spinner,
  Avatar,
  useToast,
  Link,
  IconButton
} from '@chakra-ui/react';

import { 
  OriginAppchainInfo, 
  AppchainState, 
  AppchainSortingField,
  AppchainSortingOrder,
  AppchainId,
  Transaction
} from 'types';

import { HiOutlineArrowNarrowRight, HiOutlineArrowNarrowLeft } from 'react-icons/hi';

import { ExternalLinkIcon, CloseIcon } from '@chakra-ui/icons';
import { FiCheckCircle } from 'react-icons/fi';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { useNavigate, useParams } from 'react-router-dom';
import { useGlobalStore, useTransactionStore } from 'stores';
import { octopusConfig } from 'config';
import { BridgeForm } from './BridgeForm';

const ToastRender = (txn: Transaction, onClose) => {
  return (
    <Box p={3} boxShadow="md" bg="white" borderRadius="lg">
      <Flex>
        {
          txn.status === 'loading' ?
          <DotLoader size={24} color="#868099" /> :
          txn.status === 'success' ?
          <Icon as={FiCheckCircle} boxSize={6} /> :
          <Icon as={AiOutlineCloseCircle} boxSize={6} />
        }
        <Box ml={3}>
          <Flex alignItems="center" justifyContent="space-between">
            <Heading fontSize="md">{txn.message}</Heading>
            <IconButton aria-label="close" onClick={onClose} size="xs" isRound>
              <CloseIcon boxSize={2} />
            </IconButton>
          </Flex>
          <Text fontSize="sm" mt={1}>{txn.summary}</Text>
          <Link href={`https://explorer.${octopusConfig.networkId}.oct.network/${txn.appchainId}/tx/${txn.hash}`} isExternal>
            <HStack fontSize="xs" color="gray" mt={1}>
              <Text>View on Explorer</Text>
              <ExternalLinkIcon />
            </HStack>
          </Link>
        </Box>
      </Flex>
    </Box>
  );
}

export const Bridge: React.FC = () => {
  
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [activeAppchains, setActiveAppchains] = useState<OriginAppchainInfo[]>();

  const globalStore = useGlobalStore(state => state.globalStore);
  const transactions = useTransactionStore(state => state.transactions);

  useEffect(() => {

    if (!globalStore.registryContract) {
      return;
    }

    globalStore
      .registryContract
      .get_appchains_with_state_of({
        appchain_state: [AppchainState.Active],
        page_number: 1,
        page_size: 20,
        sorting_field: AppchainSortingField.RegisteredTime,
        sorting_order: AppchainSortingOrder.Descending
      })
      .then(appchains => {
        setActiveAppchains(appchains);
      });

  }, [globalStore]);

  useEffect(() => {
    const txns = Object.values(transactions);
    if (!txns.length) {
      toast.closeAll();
      return;
    }

    txns.forEach(txn => {
    
      if (txn.status === 'loading') {
    
        if (!toast.isActive(txn.hash)) {
          toast({
            id: txn.hash,
            position: 'top-right',
            title: txn.message,
            description: txn.summary,
            status: 'info',
            duration: null,
            isClosable: true,
            render: (e) => ToastRender(txn, e.onClose)
          });
        }
      } else if (txn.status === 'error') {
        if (toast.isActive(txn.hash)) {
          toast.update(txn.hash, {
            title: 'Error',
            description: txn.message,
            status: 'error',
            duration: 3500
          });
        }
      }
    });
  }, [transactions, toast]);

  useEffect(() => {
    return () => {
      toast.closeAll();
    }
  }, [toast]);

  const currentAppchain = useMemo(() => activeAppchains?.find(appchain => appchain.appchain_id === id), [activeAppchains, id]);

  const onSelectAppchain = (appchainId: AppchainId) => {
    navigate(`/bridge/${appchainId}`);
  }

  const onBack = () => {
    window.location.href = '/bridge';
  }

  return (
    <Container maxW="520px" minH="calc(100vh - 400px)" >
      <Flex mt={12} flexDirection="column" alignItems="center">
        <HStack>
          <Heading fontSize="3xl" fontWeight={600}>
            {
              currentAppchain ? 'Bridge your' : 'Running'
            }
          </Heading>
          <Heading fontSize="3xl" fontWeight={600} bg="linear-gradient(to right, #fcc00a, #4ebae9)" 
            bgClip="text" color="transparent" animation="hue 10s linear infinite;">
            {
              currentAppchain ? 'Assets' : 'Appchains'
            }
          </Heading>
        </HStack>
        {
          currentAppchain ?
          <VStack mt={2}>
         
            <HStack cursor="pointer" color="gray" onClick={onBack} fontSize="md">
              <Icon as={HiOutlineArrowNarrowLeft} boxSize={3} />
              <Text>Appchains</Text>
            </HStack>
          </VStack> : null
        }
      </Flex>
      {
        currentAppchain ?
        <Box mt={6}>
          <BridgeForm appchain={currentAppchain} />
        </Box> :
        activeAppchains?.length ?
        <List mt={10} spacing={5}>
          {
            activeAppchains.map((appchain, idx) => (
              <Box p={4} borderRadius="xl" boxShadow="lg" bg="white" key={`appchain-${idx}`}>
                <Flex justifyContent="space-between" alignItems="center">
                  <HStack>
                    <Avatar name={appchain.appchain_id} size="xs" display={{ base: 'none', md: 'block' }} 
                      bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'}
                      src={appchain.appchain_metadata?.fungible_token_metadata?.icon} />
                    <Heading fontSize="lg">{appchain.appchain_id}</Heading>
                  </HStack>
                  <Button size="sm" onClick={() => onSelectAppchain(appchain.appchain_id)}>
                    <Text>Enter</Text>
                    <Icon as={HiOutlineArrowNarrowRight} ml="2" />
                  </Button>
                </Flex>
              </Box>
            ))
          }
        </List> :
        <Center minH="20vh">
          <Spinner size="lg" thickness="6px" speed="1s" color="gray.500" />
        </Center>
      }
    </Container>
  );
}