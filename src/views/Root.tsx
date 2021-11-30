import React, { useEffect, useRef, useMemo, useCallback } from 'react';

import {
  useToast,
  Spinner,
  useColorModeValue,
  Box,
  Container,
  Center
} from '@chakra-ui/react';

import { 
  providers, 
  connect, 
  keyStores, 
  WalletConnection
} from 'near-api-js';

import { 
  RegistryContract,
  TokenContract
} from 'types';

import { octopusConfig } from 'config';
import { Footer, Header } from 'components';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useGlobalStore } from 'stores';

const Loading = () => {
  return (
    <Box p="2">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="md"
      />
    </Box>
  );
}

export const Root: React.FC = () => {
  const toast = useToast();
  const urlParams = useMemo(() => 
    new URLSearchParams(window.location.search)
    , []);

  const transactionHashes = urlParams.get('transactionHashes') || '';
  const errorMessage = urlParams.get('errorMessage') || '';

  const bgImage = useColorModeValue('linear-gradient(to bottom, #f5f6f9, #fff 60vh)', 'none');

  const location = useLocation();
  const navigate = useNavigate();
  const toastIdRef = useRef<any>();

  const { globalStore, updateGlobalStore } = useGlobalStore();
  // const { appendTxn, updateTxn } = useTransactionStore();
  
  const checkRedirect = useCallback(() => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate('/appchains');
    }
  }, [location.pathname, navigate]);

  const checkBridge = useCallback((hashes, status) => {
    if (/bridge/.test(location.pathname)) {
      console.log(hashes, status);
      // appendTxn({
      //   from: globalStore.accountId,
      //   message: 'Transfer Asset',
      //   summary: `Transfer ${amount} ${bridgeToken.symbol} to ${targetAddress}`,
      //   addedTime: new Date().getTime(),
      //   status: 'loading',
      //   hash: hashes,
      //   appchainId: appchain.appchain_id
      // });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!globalStore.accountId) {
      return;
    }
    
    if (transactionHashes) {
      toastIdRef.current = toast({
        position: 'top-right',
        render: () => <Loading />,
        status: 'info',
        duration: null
      });
      const provider = new providers.JsonRpcProvider(octopusConfig.archivalUrl);
      provider
        .txStatus(transactionHashes, globalStore.accountId)
        .then(status => {
          console.log(status);
          const { receipts_outcome } = status;
          let message = '';
          for (let i = 0; i < receipts_outcome.length; i++) {
            const { outcome } = receipts_outcome[i];
            if ((outcome.status as any).Failure) {
              message = JSON.stringify((outcome.status as any).Failure);
              break;
            }
          }
          if (message) {
            throw new Error(message);
          } else {
            toast.update(toastIdRef.current, {
              description: 'Success',
              duration: 2500,
              variant: 'left-accent',
              status: 'success'
            });
            checkBridge(transactionHashes, status);
            checkRedirect();
          }
        }).catch(err => {
          setTimeout(() => {
            toast.update(toastIdRef.current, {
              description: err?.kind?.ExecutionError || err.toString(),
              duration: 5000,
              status: 'error'
            });
          }, 500);
        });
    } else if (errorMessage) {
      toast({
        position: 'top-right',
        description: decodeURIComponent(errorMessage),
        status: 'error'
      });
    }

    // clear message
    const { protocol, host, pathname, hash } = window.location;
    urlParams.delete('errorMessage');
    urlParams.delete('transactionHashes');
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${params ? '?' + params : ''}${hash}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

  }, [errorMessage, transactionHashes, checkBridge, checkRedirect, toast, urlParams, globalStore]);

  // init near
  useEffect(() => {
    connect({
      ...octopusConfig,
      deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
    }).then(near => {
      const walletConnection = new WalletConnection(near, 'octopus_bridge');
      const pjsAccount = window.localStorage.getItem('pjsAccount') || undefined;

      const registryContract = new RegistryContract(
        walletConnection.account(),
        octopusConfig.registryContractId,
        {
          viewMethods: [
            'get_minimum_register_deposit', 
            'get_appchains_with_state_of', 
            'get_appchain_status_of', 
            'get_registry_settings',
            'get_upvote_deposit_for', 
            'get_downvote_deposit_for', 
            'get_appchains_count_of', 
            'get_total_stake', 
            'get_owner'
          ],
          changeMethods: [
            'start_auditing_appchain', 
            'reject_appchain', 
            'remove_appchain', 
            'pass_auditing_appchain', 
            'update_appchain_metadata',
            'withdraw_upvote_deposit_of', 
            'withdraw_downvote_deposit_of', 
            'count_voting_score', 
            'conclude_voting_score'
          ]
        }
      );
    
      const tokenContract = new TokenContract(
        walletConnection.account(),
        octopusConfig.tokenContractId,
        {
          viewMethods: ['ft_balance_of'],
          changeMethods: ['ft_transfer_call']
        }
      );

      updateGlobalStore({
        accountId: walletConnection.getAccountId(),
        registryContract,
        tokenContract,
        walletConnection,
        pjsAccount
      });

    });
   
  }, [updateGlobalStore]);

  return (
    <>
      <Container minH="100vh" maxW="full" 
        bgImage={bgImage} bgSize="100% 100vh" bgRepeat="no-repeat">
        <Header />
        {
          (
            !!!globalStore.registryContract ||
            !!!globalStore.walletConnection
          ) ?
          <Center minH="20vh">
            <Spinner size="xl" thickness="6px" speed="1s" color="gray.500" />
          </Center> :
          <Outlet />
        }
        <Footer />
        
      </Container>
    </>
  );
}
