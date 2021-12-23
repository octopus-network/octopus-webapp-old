import React, { useEffect, useRef, useMemo, useCallback } from 'react';

import {
  useToast,
  Spinner,
  useColorModeValue,
  Box,
  Container,
  Center,
  useInterval
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
import axios from 'axios';
import { encodeAddress } from '@polkadot/util-crypto';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { DecimalUtils, toShortAddress } from 'utils';

import { 
  useGlobalStore, 
  useRefDataStore, 
  useTransactionStore 
} from 'stores';

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
  const { appendTxn, transactions } = useTransactionStore();
  const { updateRefData } = useRefDataStore();

  const checkRedirect = useCallback(() => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate('/appchains');
    }
  }, [location.pathname, navigate]);

  const onAppchainTokenBurnt = async ({
    hash, appchainId, nearAccount, appchainAccount, 
    amount, notificationIndex
  }) => {
    if (!transactions[hash]) {
      const base58Address = encodeAddress(appchainAccount);
      const appchainStatus = await 
        globalStore
          .registryContract
          .get_appchain_status_of({
            appchain_id: appchainId
          });
      
      const decimalAmount = DecimalUtils.fromString(amount, appchainStatus?.appchain_metadata?.fungible_token_metadata?.decimals || 1);
      const tokenSymbol = appchainStatus?.appchain_metadata?.fungible_token_metadata?.symbol || `${appchainId} token`;

      appendTxn({
        from: nearAccount,
        message: 'Transfer Asset',
        summary: `Transfer ${DecimalUtils.beautify(decimalAmount)} ${tokenSymbol} to ${toShortAddress(base58Address)}`,
        addedTime: new Date().getTime(),
        status: 'loading',
        hash,
        notificationIndex,
        appchainId
      });

    }
  }

  useEffect(() => {
    if (!globalStore.accountId) {
      return;
    }

    const isBridgeTx = /bridge/.test(location.pathname);

    if (transactionHashes) {
      if (!isBridgeTx) {
        toastIdRef.current = toast({
          position: 'top-right',
          render: () => <Loading />,
          status: 'info',
          duration: null
        });
      }
      
      const provider = new providers.JsonRpcProvider(octopusConfig.archivalUrl);

      provider
        .txStatus(transactionHashes, globalStore.accountId)
        .then(status => {
          const { receipts_outcome } = status;
     
          let message = '';
          for (let i = 0; i < receipts_outcome.length; i++) {
            const { outcome } = receipts_outcome[i];
            if ((outcome.status as any).Failure) {
              message = JSON.stringify((outcome.status as any).Failure);
              break;
            }
            if (outcome.logs?.length) {
              const log = outcome.logs[0];
            
              const res = /Wrapped appchain token burnt by '(.+)' for '(.+)' of appchain. Amount: '(.+)', Crosschain notification index: '(.+)'/.exec(log);
              if (res?.length) {
                const nearAccount = res[1],
                  appchainAccount = res[2],
                  amount = res[3],
                  notificationIndex = res[4];

                const appchainId = status.transaction.receiver_id.split('.')?.[0];
                
                onAppchainTokenBurnt({
                  hash: status.transaction.hash, appchainId, nearAccount, 
                  appchainAccount, amount, notificationIndex
                });
              }
            }
          }
          if (message) {
            throw new Error(message);
          } else {
            if (!isBridgeTx) {
              toast.update(toastIdRef.current, {
                description: 'Success',
                duration: 2500,
                variant: 'left-accent',
                status: 'success'
              });
            }
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

  }, [errorMessage, transactionHashes, location.pathname, checkRedirect, toast, urlParams, globalStore]);

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

  const fetchRefData = React.useRef<any>();
  fetchRefData.current = () => {
    axios
      .get('https://sodaki.com/api/last-tvl')
      .then(res => res.data)
      .then(data => {
        updateRefData(data);
      });
  }

  useEffect(() => {
    fetchRefData.current();
  }, []);

  useInterval(() => {
    fetchRefData.current();
  }, 30 * 1000);

  return (
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
  );
}
