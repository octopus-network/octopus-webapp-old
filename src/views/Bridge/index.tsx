import React, { useEffect, useState, useMemo } from 'react';

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
  useToast
} from '@chakra-ui/react';

import { 
  OriginAppchainInfo, 
  AppchainState, 
  AppchainSortingField,
  AppchainSortingOrder,
  AppchainId
} from 'types';

import { 
  HiOutlineArrowNarrowRight, 
  HiOutlineArrowNarrowLeft 
} from 'react-icons/hi';

import { useNavigate, useParams } from 'react-router-dom';
import { useGlobalStore } from 'stores';
import { BridgeForm } from './BridgeForm';

export const Bridge: React.FC = () => {
  
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [activeAppchains, setActiveAppchains] = useState<OriginAppchainInfo[]>();

  const globalStore = useGlobalStore(state => state.globalStore);

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