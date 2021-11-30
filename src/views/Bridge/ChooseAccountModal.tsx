import React from 'react';

import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  Flex,
  Text,
  List,
  Box,
  VStack,
  Heading
} from '@chakra-ui/react';

import { toShortAddress } from 'utils';
import IdentityIcon from '@polkadot/react-identicon';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

type ChooseAccountModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  accounts: InjectedAccountWithMeta[];
  onChoose: Function;
}

export const ChooseAccountModal: React.FC<ChooseAccountModalProps> = ({ isOpen, onClose, accounts, onChoose }) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {
            accounts?.length ?
            <List>
              {
                accounts.map(account => (
                  <Flex p={3} key={`account-${account.address}`} alignItems="center" borderRadius="xl" cursor="pointer" _hover={{
                    background: 'blackAlpha.100'
                  }} onClick={() => onChoose(account)}>
                    <IdentityIcon size={32} value={account.address} />
                    <VStack spacing={0} alignItems="flex-start" ml={2}>
                      <Heading fontSize="md">{account.meta.name || 'No Name'}</Heading>
                      <Text fontSize="sm" color="gray">{toShortAddress(account.address)}</Text>
                    </VStack>
                  </Flex>
                ))
              }
            </List> : 
            <Box p={6}>
              <Text color="gray">No Accounts. Please import account via your wallet extension.</Text>
            </Box>
          }
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}