import React, { useState, useEffect } from 'react';

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
import { DecimalUtils, ZERO_DECIMAL, appchainStates } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'config/constants';
import { utils } from 'near-api-js';
import { AiOutlineBlock, AiOutlineDollarCircle, AiOutlineDeploymentUnit } from 'react-icons/ai';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';
import { StatCard } from './StatCard';
import Decimal from 'decimal.js';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  box-shadow: rgb(0 0 0 / 20%) 0px 0px 2px;
  transition: transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s;
  cursor: pointer;
  &:hover {
    box-shadow: rgb(0 0 0 / 15%) 0px 0px 10px;
    transform: scaleX(0.99);
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

  const { appchain_id, validator_count, total_stake, appchain_state } = appchain;
 
  const state2color = {
    'Auditing': 'green',
    'Voting': 'teal',
    'Staging': 'blue',
    'Booting': 'yellow'
  }

  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 13, md: 17 }} p={4} alignItems="center">
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="sm" display={{ base: 'none', md: 'block' }} bg="blue.100" />
          <Heading fontSize="xl">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{validator_count}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Heading fontSize="md">
          {
            DecimalUtils.beautify(
              DecimalUtils.fromString(total_stake, OCT_TOKEN_DECIMALS)
            )
          } OCT
        </Heading>
      </GridItem>
      <GridItem colSpan={4} textAlign="right" display={{ base: 'none', md: 'block' }}>
        <Badge variant="outline" colorScheme={state2color[appchain_state]}>{appchainStates[appchain_state]}</Badge>
      </GridItem>
    </StyledAppchainItem>
  );
}

export const Home: React.FC = () => {
  
  const [isDesktop] = useMediaQuery('(min-width: 62em)');
  const { t } = useTranslation();

  const [numberAppchains, setNumberAppchains] = useState<Decimal>();
  const [stakedAmount, setStakedAmount] = useState<Decimal>();
  const [appchains, setAppchains] = useState<any[]|null>();
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currBlock, setCurrBlock] = useState<Decimal>();

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
      setNumberAppchains(DecimalUtils.fromString(count));
      setStakedAmount(
        DecimalUtils.fromString(amount, OCT_TOKEN_DECIMALS)
      );
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
          setCurrBlock(DecimalUtils.fromString(result.header.height));
        })
        .finally(() => {
          setIsFetching(false);
        });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isFetching]);

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
        <Box mt="80px" position="relative" zIndex="1">
          <Center>
            <RouterLink to="/appchains/join">
              <JoinButton colorScheme="octoColor" variant="outline">
                <Text>{t('Join Octopus')}</Text>
                <Icon as={HiOutlineArrowNarrowRight} ml="2" />
              </JoinButton>
            </RouterLink>
          </Center>
        </Box>
        {/* <Box position="absolute" left="0" right="0" bottom="0" top="0" opacity=".2" zIndex="0"
          bg={`url(${globe}) center -50px / cover no-repeat;`} /> */}
      </Container>
      <Container>
        <Grid templateColumns={isDesktop ? 'repeat(3, 1fr)' : 'repeat(1, 1fr)'} gap={12}>
          <StatCard title={t('Total Appchains')} bg="linear(to-r, #2193b0, #6dd5ed)" value={
            numberAppchains?.gte(ZERO_DECIMAL) ? numberAppchains.toString() : ''
            } icon={<Icon as={AiOutlineBlock} w="6" h="6" color="whiteAlpha.500" />} />
          <StatCard title={t('Staked OCT')} bg="linear(to-r, #e75ba4, #e06395)" value={
              stakedAmount?.gte(ZERO_DECIMAL) ? DecimalUtils.beautify(stakedAmount) : ''
            } icon={<Icon as={AiOutlineDollarCircle} w="6" h="6" color="whiteAlpha.500" />} />
          <StatCard title={t('Block Height')} bg="linear(to-r, #5b86e5, #36d1dc)" value={
              currBlock?.gt(ZERO_DECIMAL) ? DecimalUtils.beautify(currBlock, 0) : ''
            } icon={<Icon as={AiOutlineDeploymentUnit} w="6" h="6" color="whiteAlpha.500" />} />
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
