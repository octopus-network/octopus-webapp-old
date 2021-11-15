import React, { useEffect, useState } from 'react';

import {
  Container,
  Box,
  Heading,
  List,
  Skeleton,
  Grid,
  GridItem,
  useMediaQuery,
  Flex,
  Avatar,
  HStack,
  IconButton,
  useClipboard
} from '@chakra-ui/react';

import { Contract, utils } from 'near-api-js';
import { octopusConfig } from 'config';
import TokenItem from './TokenItem';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import ActivityItem from './ActivityItem';
import { useGlobalStore } from 'stores';

const tokenContractIds = [octopusConfig.tokenContractId];

const Dashboard = () => {

  const [isDesktop] = useMediaQuery('(min-width: 62em)');
  const [tokenList, setTokenList] = useState([]);
  const [activityList, setActivityList] = useState([]);
  const [accountBalance, setAccountBalance] = useState('0');
  const globalStore = useGlobalStore(state => state.globalStore);

  const { hasCopied, onCopy } = useClipboard(globalStore.accountId);

  useEffect(() => {
    if (!globalStore.accountId) {
      return;
    }
    
    globalStore.walletConnection
      .account()
      .getAccountBalance()
      .then(balance => {
        setAccountBalance(balance.total);
      });
      
    const promises = tokenContractIds.map(contractId => {
      const contract: any = new Contract(
        globalStore.walletConnection.account(),
        contractId,
        {
          viewMethods: ['ft_balance_of', 'ft_metadata'],
          changeMethods: []
        }
      );
      return Promise.all([
        contract.ft_metadata(), 
        contract.ft_balance_of({
          account_id: globalStore.accountId
        }),
        contractId
      ]);
    });
    
    Promise.all(promises).then(data => {
      setTokenList(data);
    });

    utils.web
      .fetchJson(`${octopusConfig.helperUrl}/account/${globalStore.accountId}/activity`)
      .then(list => {
        setActivityList(list.slice(0, 5));
      });

  }, [globalStore]);

  return (
    <Container pb="8" pt="8">
      <Grid templateColumns={isDesktop ? 'repeat(13, 1fr)' : 'repeat(1, 1fr)'} gap="6">
        <GridItem colSpan={isDesktop ? 8 : 1}>
          <Box shadow="octoShadow" p="6" borderRadius="10">
            <Flex flexDirection="column" alignItems="center" p="12">
              <Avatar />
              <HStack alignItems="center" mt="3">
                <Heading fontSize="lg" fontWeight="600">{globalStore.accountId}</Heading>
                <IconButton size="sm" aria-label="Copy" icon={
                  hasCopied ? <CheckIcon />: <CopyIcon />
                } onClick={onCopy} />
              </HStack>
            </Flex>
            <Box pb="2">
              <Heading fontSize="xl">Assets</Heading>
            </Box>
            <List>
              <TokenItem token={[
                {
                  symbol: 'NEAR',
                  decimals: 24,
                  icon: 'https://ethereum.bridgetonear.org/near.0b26889d.svg'
                },
                accountBalance
              ]} key={`token-item-near`} boxShadow='inset 0 -1px #eaeaea' />
              {
                tokenList.length ?
                tokenList.map((token, idx) => (
                  <TokenItem token={token} key={`token-item-${idx}`} boxShadow={
                    idx === tokenList.length - 1 ? '' : 'inset 0 -1px #eaeaea'
                  } />
                )) :
                <Skeleton borderRadius="5px" isLoaded={!!tokenList?.length}>
                  <Box h="74px" />
                </Skeleton>
              }
            </List>
          </Box>
        </GridItem>
        <GridItem colSpan={isDesktop ? 5 : 1}>
          <Box shadow="octoShadow" p="6" borderRadius="10">
            <Box pb="4">
              <Heading fontSize="xl">Recent activity</Heading>
            </Box>
            <List>
              {
                activityList.length ?
                activityList.map((activity, idx) => (
                  <ActivityItem accountId={globalStore.accountId} activity={activity} key={`activity-item-${idx}`} boxShadow={
                    idx === activity.length - 1 ? '' : 'inset 0 -1px #eaeaea'
                  } />
                )) :
                <Skeleton borderRadius="5px" isLoaded={!!activityList?.length}>
                  <Box h="40px" />
                </Skeleton>
              }
            </List>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}

export default Dashboard;