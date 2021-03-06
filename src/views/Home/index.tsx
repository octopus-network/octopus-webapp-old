import React, { useState, useEffect, useMemo } from 'react';
import { useSpring, animated, config as SpringConfig } from 'react-spring';

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
  Icon,
  useInterval
} from '@chakra-ui/react';

import {
  AppchainState,
  AppchainSortingField,
  AppchainSortingOrder,
  OriginAppchainInfo,
  AnchorContract
} from 'types';

import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Ball, NoData, AppchainListItem } from 'components';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import { utils } from 'near-api-js';
import { AiOutlineBlock, AiOutlineDollarCircle, AiOutlineDeploymentUnit } from 'react-icons/ai';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';
import { StatCard } from './StatCard';
import Decimal from 'decimal.js';
import { useGlobalStore } from 'stores';
import { octopusConfig } from 'config';
import { useNavigate } from 'react-router-dom';
import { useRefDataStore } from 'stores';
import { tokenAssets } from 'config';

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

type AppchainItemProps = {
  appchain: OriginAppchainInfo;
}

const AppchainItem: React.FC<AppchainItemProps> = React.memo(({ appchain }) => {

  const navigate = useNavigate();

  const { refData } = useRefDataStore();

  const globalStore = useGlobalStore(state => state.globalStore);
  const [delegatorCount, setDelegatorCount] = useState(0);

  useEffect(() => {
    globalStore
      .registryContract
      .get_appchain_status_of({ appchain_id: appchain.appchain_id })
      .then(({ appchain_anchor }) => {
        const contract = new AnchorContract(
          globalStore.walletConnection.account(),
          appchain_anchor,
          {
            viewMethods: [
              'get_anchor_status',
              'get_validator_list_of',
              'get_delegators_of_validator_in_era'
            ],
            changeMethods: []
          }
        );

        contract.get_validator_list_of().then(list => {
          Promise.all(list.map(item => contract.get_delegators_of_validator_in_era({
            validator_id: item.validator_id
          }))).then(res => {
            const total = res.reduce((total, delegators) => total + delegators.length, 0);
            setDelegatorCount(total);
          });
        });

      });
  }, [appchain, globalStore]);

  const apy = useMemo(() => {
    if (!appchain || !refData) return 0;
    const tokenAsset = tokenAssets[appchain.appchain_id]?.[0];
    if (!tokenAsset) {
      return 0;
    }
    const appchainTokenData = refData.find(data => data.ftInfo?.symbol === tokenAsset.symbol);
    const octTokenData = refData.find(data => data.ftInfo?.symbol === 'OCT');
    
    if (!appchainTokenData || !octTokenData) {
      return 0;
    }

    return DecimalUtils.fromNumber(5_000_000 * appchainTokenData.price * 100).div(
      DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS).mul(
        octTokenData.price
      )
    ).toNumber();
  }, [refData, appchain]);

  const { animatedAPY } = useSpring({
    reset: true,
    from: { animatedAPY: 0 },
    animatedAPY: apy,
    config: SpringConfig.slow
  });
  
  return (
    <AppchainListItem columns={{ base: 15, md: 19 }}
      onClick={() => navigate(`/appchains/${appchain.appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar 
            size="sm" 
            name={appchain.appchain_id} 
            display={{ base: 'none', md: 'block' }}
            src={appchain.appchain_metadata.fungible_token_metadata.icon} 
            bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'} />
          <Heading fontSize="xl">{appchain.appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="xl">{appchain.validator_count}</Text>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="xl">{delegatorCount || '-'}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">
          {
            DecimalUtils.beautify(
              DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS)
            )
          } OCT
        </Text>
      </GridItem>
      <GridItem colSpan={2}>
        {
          apy > 0 ?
          <Heading fontSize="lg" bg="linear-gradient(to right, #fcc00a, #4ebae9)" 
            bgClip="text" color="transparent" animation="hue 10s linear infinite;">
            <animated.span>{animatedAPY.to(n => DecimalUtils.beautify(new Decimal(n)))}</animated.span>%
          </Heading> : '-'
        }
      </GridItem>
      <GridItem colSpan={4} textAlign="right" display={['none', 'block']}>
        <Button size="sm">
          <Text>Enter</Text>
          <Icon as={HiOutlineArrowNarrowRight} ml="2" />
        </Button>
      </GridItem>
    </AppchainListItem>
  );
});

export const Home: React.FC = () => {
  
  const [isDesktop] = useMediaQuery('(min-width: 62em)');
  const { t } = useTranslation();

  const [numberAppchains, setNumberAppchains] = useState<Decimal>();
  const [stakedAmount, setStakedAmount] = useState<Decimal>();
  const [appchains, setAppchains] = useState<any[]|null>();

  const [currBlock, setCurrBlock] = useState<Decimal>();

  const { globalStore } = useGlobalStore();

  useEffect(() => {

    Promise.all(
      [
        globalStore.registryContract.get_appchains_count_of(),
        globalStore.registryContract.get_total_stake(),
        globalStore.registryContract.get_appchains_with_state_of({ 
          appchain_state: [
            AppchainState.Active
          ],
          page_number: 1,
          page_size: 5,
          sorting_field: AppchainSortingField.RegisteredTime,
          sorting_order: AppchainSortingOrder.Descending
        })
      ]
    ).then(([count, amount, appchains]) => {
      setNumberAppchains(DecimalUtils.fromString(count));
      setStakedAmount(
        DecimalUtils.fromString(amount, OCT_TOKEN_DECIMALS)
      );
      setAppchains(appchains);
    });
 
  }, [globalStore]);

  useInterval(() => {
    utils.web
      .fetchJson(
        octopusConfig.nodeUrl,
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
      });
  }, 1000);

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
                <Icon as={HiOutlineArrowNarrowRight} ml={2} />
              </JoinButton>
            </RouterLink>
          </Center>
        </Box>
     
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
          <Heading fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}>{t('Running Appchains')}</Heading>
        </Flex>
        <Box mt="8" pb="4">
          <SimpleGrid columns={{ base: 15, md: 19 }} color="gray" pl="6" pr="6" fontSize="sm">
            <GridItem colSpan={5}>{t('ID')}</GridItem>
            <GridItem colSpan={2}>{t('Validators')}</GridItem>
            <GridItem colSpan={2}>{t('Delegators')}</GridItem>
            <GridItem colSpan={4}>{t('Staked')}</GridItem>
            <GridItem colSpan={2}>{t('APY')}</GridItem>
          </SimpleGrid>
        </Box>
        <List spacing={6}>
          {
            appchains ?
            appchains.length ?
            appchains.map((appchain, idx) => (
              <AppchainItem appchain={appchain} key={`appchain-item-${idx}`} />
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
