import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Flex,
  HStack,
  Avatar,
  Text,
  Button,
  Icon,
  IconButton,
  Input,
  Center,
  Image,
  Heading,
  useBoolean,
  Skeleton,
  useToast
} from '@chakra-ui/react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { AiOutlineSwap, AiOutlineArrowDown } from 'react-icons/ai';

import { 
  OriginAppchainInfo, 
  TokenAsset, 
  AnchorContract, 
  TokenContract
} from 'types';

import { useGlobalStore, useTransactionStore } from 'stores';
import { Account } from './Account';
import { AmountInput } from 'components';
import { tokenAssets } from 'config';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { ZERO_DECIMAL, DecimalUtils } from 'utils';
import Decimal from 'decimal.js';
import { decodeAddress } from '@polkadot/util-crypto';
import { web3FromSource, web3Enable } from '@polkadot/extension-dapp';
import { u8aToHex, stringToHex } from '@polkadot/util';
import { Gas } from 'primitives';

type BridgeFormProps = {
  appchain: OriginAppchainInfo;
}

const storageAccounts = window.localStorage.getItem('appchainAccounts') || '{}';

export const BridgeForm: React.FC<BridgeFormProps> = ({ appchain }) => {

  const urlParams = useMemo(() => 
    new URLSearchParams(window.location.search)
    , []);

  const [appchainTokenContract, setAppchainTokenContract] = useState<TokenContract>();
  const [anchorContract, setAnchorContract] = useState<AnchorContract>();
  const isReverse = useMemo(() => true, [urlParams]);
  const [apiPromise, setApiPromise] = useState<ApiPromise>();

  const toast = useToast();
  const tokens = useMemo(() => tokenAssets[appchain?.appchain_id] || null, [appchain]);
  const [bridgeToken, setBridgeToken] = useState<TokenAsset>();
  const [isTransfering, setIsTransfering] = useBoolean(false);

  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(ZERO_DECIMAL);
  const [isLoadingBalance, setIsLoadingBalance] = useBoolean(true);
  
  const globalStore = useGlobalStore(state => state.globalStore);
  const { appendTxn, updateTxn } = useTransactionStore();

  const nearAccount = useMemo(() => globalStore.accountId || '', [globalStore]);
  const [appchainAccount, setAppchainAccount] = useState(JSON.parse(storageAccounts)[appchain?.appchain_id] || '');
  
  const [targetAddress, setTargetAddress] = useState(isReverse ? appchainAccount : nearAccount);

  useEffect(() => {
    if (appchain?.appchain_anchor) {
      const contract = new AnchorContract(
        globalStore.walletConnection.account(),
        appchain?.appchain_anchor,
        {
          viewMethods: [
            'get_wrapped_appchain_token',
            'get_appchain_settings'
          ],
          changeMethods: [
            'burn_wrapped_appchain_token'
          ]
        }
      );

      setAnchorContract(contract);

      contract.get_wrapped_appchain_token().then(token => {
        if (token?.contract_account) {
          const tokenContract = new TokenContract(
            globalStore.walletConnection.account(),
            token.contract_account,
            {
              viewMethods: ['ft_balance_of'],
              changeMethods: ['ft_transfer_call']
            }
          );
          setAppchainTokenContract(tokenContract);
        }
      
      });

      contract.get_appchain_settings().then(async ({ rpc_endpoint }) => {
        try {
          const provider = new WsProvider(rpc_endpoint);
          new ApiPromise({ provider }).isReady.then(api => {
            setApiPromise(api);
          });
        
        } catch(err) {
          console.log(err);
        }
      });
    }
    
  }, [appchain, globalStore]);

  useEffect(() => {
    if (!bridgeToken || !apiPromise) {
      return;
    }
    setIsLoadingBalance.on();
    if (isReverse && appchainTokenContract && nearAccount) {
      appchainTokenContract
        .ft_balance_of({ account_id: nearAccount })
        .then(balance => {
          setIsLoadingBalance.off();
          setBalance(DecimalUtils.fromString(balance, bridgeToken.decimals));
        });
    } else if (!isReverse && apiPromise && appchainAccount) {
      apiPromise.derive.balances.all(appchainAccount, (balance) => {
        setBalance(
          DecimalUtils.fromString(balance.freeBalance.toString(), bridgeToken.decimals)
        );
        setIsLoadingBalance.off();
      });
    } else {
      setIsLoadingBalance.off();
      setBalance(ZERO_DECIMAL);
    }
  }, [apiPromise, nearAccount, appchainAccount, isReverse, bridgeToken, appchainTokenContract]);

  useEffect(() => {
    if (tokens?.length) {
      setBridgeToken(tokens[0]);
    }
  }, [tokens]);

  const onToggleReverse = () => {
    
    if (!isReverse) {
      urlParams.set('reverse', '1');
    } else {
      urlParams.delete('reverse');
    }
    
    const { protocol, host, pathname, hash } = window.location;
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${params ? '?' + params : ''}${hash}`;
    window.location.href = newUrl;
  }

  const onAmountChange = (value: string) => {
    setAmount(value);
  }

  const burn = async () => {
    let hexAddress = '';
    try {
      const u8a = decodeAddress(targetAddress);
      hexAddress = u8aToHex(u8a);
    } catch(err) {
      toast({
        title: 'Error',
        description: 'Invalid Address',
        status: 'error'
      });
    }
    setIsTransfering.on();
    const amount_U64 = DecimalUtils.toU64(new Decimal(amount), bridgeToken.decimals);

    if (!bridgeToken.assetId) {
      await anchorContract
        .burn_wrapped_appchain_token(
          { receiver_id: hexAddress, amount: amount_U64.toString() },
          Gas.COMPLEX_CALL_GAS
        );
    
    }
  }

  const redeem = async () => {
    setIsTransfering.on();

    const hexAddress = stringToHex(targetAddress);
    const amount_U64 = DecimalUtils.toU64(new Decimal(amount), bridgeToken.decimals);

    await web3Enable('Octopus Network');
    const injected = await web3FromSource('polkadot-js');
    apiPromise.setSigner(injected.signer);

    const tx = 
      bridgeToken.assetId ?
      apiPromise.tx.octopusAppchain.burnAsset(bridgeToken.assetId, hexAddress, amount_U64.toString()) :
      apiPromise.tx.octopusAppchain.lock(hexAddress, amount_U64.toString());
    
    appendTxn({
      from: appchainAccount,
      message: 'Transfer Asset',
      summary: `Transfer ${amount} ${bridgeToken.symbol} to ${targetAddress}`,
      addedTime: new Date().getTime(),
      status: 'loading',
      hash: tx.hash.toString(),
      appchainId: appchain.appchain_id
    });

    await tx.signAndSend(appchainAccount, (res) => {
      if (res.isFinalized) {
        setIsTransfering.off();
      }
    }).catch(err => {
     
      updateTxn(tx.hash.toString(), {
        status: 'error',
        message: err.toString()
      });
      setIsTransfering.off();
    });
  }

  const onTransfer = () => {
    if (isReverse) {
      burn();
    } else {
      redeem();
    }
  }

  return (
    <>
      <Box p={5} borderRadius="lg" boxShadow="lg" bg="white">
        <Flex justifyContent="space-between" alignItems="center">
          
          <Account isReverse={isReverse} appchainAccount={appchainAccount} nearAccount={nearAccount} avatar={
            <Avatar name={isReverse ? 'Near' : appchain?.appchain_id} size="2xs" src={
              isReverse ? '/images/near.svg' : appchain?.appchain_metadata.fungible_token_metadata.icon }
              bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'} />
          } onChooseAccount={account => setAppchainAccount(account.address)} appchainId={appchain.appchain_id} />
          <HStack>
            <HStack spacing={-2} opacity={.6}>
              <Avatar name={isReverse ? 'Near' : appchain?.appchain_id} borderWidth={2} borderColor="white" size="xs" src={
                isReverse ? '/images/near.svg' : appchain?.appchain_metadata.fungible_token_metadata.icon }
                bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'} />
              <Avatar name={isReverse ? appchain?.appchain_id : 'Near'} borderWidth={2} borderColor="white" size="xs" src={
                isReverse ? appchain?.appchain_metadata.fungible_token_metadata.icon : '/images/near.svg' }
                bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'} />
            </HStack>
            <Text fontSize="sm" opacity={.6}>
              {isReverse ? 'Near' : appchain?.appchain_id} to {isReverse ? appchain?.appchain_id : 'Near'}
            </Text>
            {/* <IconButton aria-label="switch" size="xs" borderWidth={0} variant="outline" onClick={onToggleReverse} isRound>
              <Icon as={AiOutlineSwap} />
            </IconButton> */}
          </HStack>
        </Flex>
        <Box p={2} mt={6}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color="gray">Bridge asset</Text>
            <Skeleton isLoaded={!isLoadingBalance}>
              <HStack>
                <Text fontSize="xs">
                  Balance: {
                    balance.gt(ZERO_DECIMAL) ?
                    DecimalUtils.beautify(balance) : '-'
                  }
                </Text>
                {
                  balance.gt(ZERO_DECIMAL) ?
                  <Button size="xs" variant="outline" colorScheme="blue" borderWidth={0} onClick={_ => {
                    setAmount(balance.toString());
                  }}>
                    Max
                  </Button> : null
                }
              </HStack>
            </Skeleton>
          </Flex>
          <Flex justifyContent="space-between" alignItems="center" mt={3} p={2} borderRadius="lg" bg="gray.100">
            <Button p={2} variant="ghost" _hover={{ background: '#f9fafc' }}>
              <HStack>
                <Box borderRadius="full" overflow="hidden" boxSize={6}>
                  <Image src={bridgeToken?.logoUri} boxSize="100%" />
                </Box>
                <Heading fontSize="md">{bridgeToken?.symbol}</Heading>
                <ChevronDownIcon />
              </HStack>
            </Button>
            <Box flex={1}>
              <AmountInput autoFocus textAlign="right" value={amount} onChange={onAmountChange} />
            </Box>
          </Flex>
        </Box>
        <Flex p={3} justifyContent="center">
          <Center bg="gray.100" w={8} h={8} borderRadius="full">
            <Icon as={AiOutlineArrowDown} />
          </Center>
        </Flex>
        <Box p={2} pt={0}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color="gray">Target</Text>
          </Flex>
          <Flex justifyContent="space-between" alignItems="center" mt={3} p={2} borderRadius="lg" bg="gray.100">
            <Box p={2}>
              <Avatar name={isReverse ? appchain?.appchain_id : 'Near'} size="xs" src={
                isReverse ? appchain?.appchain_metadata.fungible_token_metadata.icon : '/images/near.svg' }
                bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'} />
            </Box>
            <Box flex={1} ml={2}>
              <Input 
                fontSize="md"
                placeholder={isReverse ? `${appchain?.appchain_id} account (ss58 address)` : 'near account'} 
                variant="unstyled" 
                defaultValue={isReverse ? appchainAccount : nearAccount}
                _placeholder={{
                  opacity: .9,
                  color: 'gray'
                }} 
                onChange={e => setTargetAddress(e.target.value)}
                />
            </Box>
          </Flex>
        </Box>
      </Box>
      <Box mt={6}>
        <Button colorScheme="teal" isFullWidth size="lg" isDisabled={
          (!amount || new Decimal(amount).lte(ZERO_DECIMAL)) ||
          (
            (isReverse && !nearAccount) ||
            (!isReverse && !appchainAccount)
          ) || !targetAddress ||
          new Decimal(amount).gt(balance) || isTransfering
        } onClick={onTransfer} isLoading={isTransfering}>
          {
            (
              (isReverse && !nearAccount) ||
              (!isReverse && !appchainAccount)
            ) ?
            'Please Login' :
            (!amount || new Decimal(amount).lte(ZERO_DECIMAL)) ?
            'Enter An Amount' :
            !targetAddress ?
            `Enter ${isReverse ? `${appchain?.appchain_id} Account` : 'Near Account'}` :
            new Decimal(amount).gt(balance) ?
            'Insufficient Balance' :
            'Transfer'
          }
        </Button>
      </Box>
    </>
  );
}