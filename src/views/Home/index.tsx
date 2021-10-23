import React, { useState, useCallback, useEffect, useMemo } from 'react';

import {
  Box,
  Heading,
  Center,
  Avatar,
  VStack,
  Container,
  Button,
  Grid,
  SimpleGrid,
  GridItem,
  Flex,
  Text,
  HStack,
  Skeleton,
  List,
  useMediaQuery,
  Badge,
  Icon
} from '@chakra-ui/react';

import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Ball, NoData } from 'components';
import { fromDecimals } from 'utils';
import { utils } from 'near-api-js';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { FcComboChart, FcCurrencyExchange, FcOrgUnit } from 'react-icons/fc';
import { Link as RouterLink } from 'react-router-dom';
import StatCard from './StatCard';
import globe from 'assets/globe.svg';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .1);
  }
`;

const JoinButton = styled(Button)`
  svg {
    transition: .6s ease;
    transform: translateX(0px);
  }
  &:hover {
    svg {
      transform: translateX(5px);
    }
  }
`;

const AppchainItem = ({
  appchain
}: {
  appchain: any;
}) => {

  const { appchain_id, validators = [], appchain_state } = appchain;
  const totalStaked = useMemo(
    () => validators.reduce(
      (total, b) => total + b.staked_amount, 0
    ), [validators]);

  const state2color = {
    'Auditing': 'green',
    'Voting': 'teal',
    'Staging': 'blue',
    'Booting': 'yellow'
  }
  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 13, md: 17 }} p="6" alignItems="center">
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="sm" display={{ base: 'none', md: 'block' }} bg="blue.100" />
          <Heading fontSize="xl">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{validators.length}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Heading fontSize="md">{totalStaked} OCT</Heading>
      </GridItem>
      <GridItem colSpan={4} textAlign="right" display={{ base: 'none', md: 'block' }}>
        <Badge variant="outline" colorScheme={state2color[appchain_state]}>{appchain_state}</Badge>
      </GridItem>
    </StyledAppchainItem>
  );
}

const Home = () => {
  
  const [isDesktop] = useMediaQuery('(min-width: 62em)');
  const { t } = useTranslation();

  const [numberAppchains, setNumberAppchains] = useState<number>(-1);
  const [stakedAmount, setStakedAmount] = useState<number>(-1);
  const [appchains, setAppchains] = useState<any[]|null>();
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currBlock, setCurrBlock] = useState<number>(-1);

  useEffect(() => {
   
    Promise.all(
      [
        window.registryContract.get_appchains_count_of(),
        window.registryContract.get_total_stake(),
        window.registryContract.get_appchains_with_state_of({ 
          appchain_state: ['Booting'],
          page_number: 1,
          page_size: 5,
          sorting_field: 'RegisteredTime',
          sorting_order: 'Descending'
        })
      ]
    ).then(([count, amount, appchains]) => {
      setNumberAppchains(count);
      setStakedAmount(fromDecimals(amount));
      setAppchains(appchains);
    });
  
    let timer = setInterval(() => {
      if (isFetching) return false;
      setIsFetching(true);
      utils.web
        .fetchJson(
          window.walletConnection._near?.config.nodeUrl,
          JSON.stringify({
            jsonrpc: "2.0",
            id: "dontcare",
            method: "block",
            params: {
              finality: "final",
            },
          })
        )
        .then(({ result }) => {
          setCurrBlock(result.header.height);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <Container
        pt={{ base: '36px', md: '48px', lg: '80px' }} 
        pb={{ base: '36px', md: '48px', lg: '80px' }}
        position="relative"
      >
        <Center position="relative" >
          <VStack spacing="3" textAlign="center" position="relative" zIndex="1">
            <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>{t('Where Web3.0 Happens')}</Heading>
            <Text fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}>{t('A cryptonetwork for launching and running Web3.0 Appchains')}</Text>
          </VStack>
          <Box position="absolute" left="0" top="50%" bottom="0" right="0" 
            zIndex="0">
            <Center transform="translateY(-50%)">
              <Ball width={isDesktop ? 220 : 180} height={isDesktop ? 220 : 180} />
            </Center>
          </Box>
        </Center>
        <Box mt="60px" position="relative" zIndex="1">
          <Center>
            <RouterLink to="/appchains/join">
              <JoinButton colorScheme="octoColor">
                <Text>{t('Join Octopus')}</Text>
                <Icon as={HiOutlineArrowNarrowRight} ml="2" />
              </JoinButton>
            </RouterLink>
          </Center>
        </Box>
        <Box position="absolute" left="0" right="0" bottom="0" top="0" opacity=".2" zIndex="0"
          bg={`url(${globe}) center -50px / cover no-repeat;`} />
      </Container>
      <Container>
        <Grid templateColumns={isDesktop ? 'repeat(3, 1fr)' : 'repeat(1, 1fr)'} gap={12}>
          <StatCard title={t('Total Appchains')} value={numberAppchains} 
            icon={<Icon as={FcComboChart} w="6" h="6" />} />
          <StatCard title={t('Staked OCT')} value={stakedAmount} 
            icon={<Icon as={FcCurrencyExchange} w="6" h="6" />} />
          <StatCard title={t('Block Height')} value={currBlock} 
            icon={<Icon as={FcOrgUnit} w="6" h="6" />} />
        </Grid>
      </Container>
      <Container mt="16" mb="16" minH="30vh">
        <Flex justifyContent="space-between">
          <Heading fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}>{t('Booting Appchains')}</Heading>
        </Flex>
        <Box mt="8" pb="4">
          <SimpleGrid columns={{ base: 13, md: 17 }} color="gray" pl="6" pr="6" fontSize="sm">
            <GridItem colSpan={5}>{t('ID')}</GridItem>
            <GridItem colSpan={4}>{t('Validators')}</GridItem>
            <GridItem colSpan={4}>{t('Staked')}</GridItem>
            <GridItem colSpan={4} textAlign="right" 
              display={{ base: 'none', md: 'block' }}>{t('State')}</GridItem>
          </SimpleGrid>
        </Box>
        <List spacing={6}>
          {
            appchains ?
            appchains.length ?
            appchains.map((appchain, idx) => (
              <AppchainItem appchain={appchain} />
            )) :
            <NoData /> :
            <Skeleton borderRadius="5px" isLoaded={!!appchains?.length}>
              <Box h="80px" />
            </Skeleton>
          }
        </List>
      </Container>
    </>
  );
}

export default Home;