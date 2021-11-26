import React, { useEffect, useState } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Heading,
  FormControl,
  FormLabel,
  Flex,
  Input,
  Button,
  Text,
  Box,
  Link,
  Select,
  useBoolean,
  useToast
} from '@chakra-ui/react';

import { ApiPromise } from '@polkadot/api';

import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { isWeb3Injected, web3FromSource, web3Enable, web3Accounts } from '@polkadot/extension-dapp';

type SetSessionKeyModalProps = {
  apiPromise: ApiPromise;
  isOpen: boolean;
  onClose: VoidFunction;
}

export const SetSessionKeyModal: React.FC<SetSessionKeyModalProps> = ({ apiPromise, isOpen, onClose }) => {
  const toast = useToast();

  const [currentAccount, setCurrentAccount] = useState<InjectedAccountWithMeta>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>();
  const [key, setKey] = useState('');
  const [isSubmiting, setIsSubmiting] = useBoolean(false);

  useEffect(() => {
    web3Enable('Octopus Network').then(res => {
      web3Accounts().then(accounts => {
        setAccounts(accounts);
        if (accounts.length) {
          setCurrentAccount(accounts[0]);
        }
      });
    });
  }, [apiPromise]);

  useEffect(() => {
    setKey('');
  }, [isOpen]);

  const onAccountChange = (addr: string) => {
    setCurrentAccount(
      accounts.find(account => account.address === addr)
    );
  }

  const onSubmit = async () => {
    setIsSubmiting.on();
    const injected = await web3FromSource(currentAccount.meta.source);
    apiPromise.setSigner(injected.signer);

    const tx = apiPromise.tx.session.setKeys(key, '0x00');

    try {
      await tx.signAndSend(currentAccount.address, () => {
        setIsSubmiting.off();
        toast({
          title: 'Set session keys success',
          status: 'success',
          position: 'top-right'
        });
      }).catch(err => {
        throw new Error(err.toString());
      });
    } catch(err) {
      setIsSubmiting.off();
      toast({
        title: err.toString(),
        status: 'error',
        position: 'top-right'
      });
    }
    
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex alignItems="center" justifyContent="space-between">
            <Heading fontSize="xl">Set Session Key</Heading>
            <Link href="https://docs.oct.network/maintain/validator-set-session-keys.html" isExternal>How to get?</Link>
          </Flex>
          <FormControl mt={4}>
            <FormLabel>Choose Account</FormLabel>
            {
              isWeb3Injected ?
              <Select onChange={e => onAccountChange(e.target.value)}>
                {
                  accounts?.map(account => (
                    <option value={account.address} key={`account-${account.address}`}>{account.address}</option>
                  ))
                }
              </Select> :
              <Text color="gray">Not found wallet extension</Text>
            }
          </FormControl>
          <FormControl mt={2}>
            <FormLabel>Session Key</FormLabel>
            <Input type="text" placeholder="Your session key" autoFocus onChange={e => setKey(e.target.value)} />
          </FormControl>
          <Box mt={5}>
            <Button colorScheme="octoColor" isFullWidth isDisabled={!key || !currentAccount} 
              onClick={onSubmit} isLoading={isSubmiting}>Set</Button>
          </Box>
          <Box pb={4} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}