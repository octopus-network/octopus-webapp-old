import React, { ReactNode, useMemo } from 'react';

import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  Flex,
  Text,
  HStack,
  Heading,
  IconButton,
  Box,
  Button,
  useClipboard,
  Link,
  List,
  Icon,
  Spinner,
  Divider
} from '@chakra-ui/react';

import { Transaction } from 'types';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { toShortAddress } from 'utils';
import { useGlobalStore, useTransactionStore } from 'stores';
import { octopusConfig } from 'config';

import { 
  IoMdCloseCircleOutline, 
  IoMdCheckmarkCircleOutline
} from 'react-icons/io';

type AccountModalProps = {
  appchainId: string;
  avatar: ReactNode;
  isOpen: boolean;
  onClose: VoidFunction;
  account: string;
  isNearAccount: boolean;
  onChangeAccount: VoidFunction; 
}

export const AccountModal: React.FC<AccountModalProps> = ({ appchainId, isOpen, onClose, account, isNearAccount, onChangeAccount, avatar }) => {

  const globalStore = useGlobalStore(state => state.globalStore);
  const { hasCopied: addressCopied, onCopy: onCopyAddress } = useClipboard(account);

  const { transactions, clearTxns } = useTransactionStore();

  const explorerUrl = useMemo(() => 
    isNearAccount ? 
    octopusConfig.nearExplorerUrl : 
    `https://explorer.${octopusConfig.networkId}.oct.network/${appchainId}`
  , [isNearAccount, appchainId]);

  const sortedTxns = useMemo(() => {
    let tmpArr = [];
    Object.keys(transactions).forEach(hash => {
      let txn = transactions[hash];
      if (txn.from === account) {
        tmpArr.push(txn);
      }
    });
    return Object.values(tmpArr).sort((a: any, b: any) => b.addedTime - a.addedTime);
  }, [transactions, account]);

  const onLogout = () => {
    globalStore
      .walletConnection
      .signOut();
    
    window.location.replace(window.location.origin + window.location.pathname);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box borderWidth={1} p={3} borderRadius="xl">
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" color="gray">
                { isNearAccount ? 'Near Account' : `${appchainId} account` }
              </Text>
              <Button size="xs" onClick={isNearAccount ? onLogout : onChangeAccount}>
                { isNearAccount ? 'Logout' : 'Change' }
              </Button>
            </Flex>
            <Flex alignItems="center" mt={3} mb={3}>
              { avatar }
              <HStack>
                <Heading fontSize="md" ml={2}>
                  {toShortAddress(account)}
                </Heading>
                <IconButton size="xs" onClick={onCopyAddress} aria-label="copy">
                  {addressCopied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </HStack>
            </Flex>
            <Flex mt={3}>
              <HStack as={Link} fontSize="xs" color="gray" ml={2}
                href={`${explorerUrl}/account/${account}`} isExternal>
                <Text>View on Explorer</Text>
                <ExternalLinkIcon />
              </HStack>
            </Flex>
          </Box>
          <Flex alignItems="center" justifyContent="space-between" mt={4}>
            <Heading color="gray" fontSize="xs">
              Your Transactions {sortedTxns.length > 0 ? '' : ' will apear here'}
            </Heading>
            {
              sortedTxns.length > 0 ?
              <Button size="xs" variant="outline" onClick={clearTxns}>
                Clear
              </Button> : null
            }
          </Flex>
          <Divider mt={3} mb={3} />
          <List maxH="20vh" overflowY="scroll">
          {
            sortedTxns.map((tx: Transaction) => {
              const { status, summary, hash } = tx;
              
              const statusColors = {
                'success': '#7BD2A2',
                'error': '#EF1111',
                'loading': '#868099'
              }

              return (
                <Box key={hash}>
                  <Flex key={`tx-${hash}`} pt={1} pb={1} alignItems="center" justifyContent="space-between" 
                    color={statusColors[status]}>
                    <Text fontSize="sm"  maxWidth="50%" whiteSpace="nowrap" textOverflow="ellipsis"
                      overflow="hidden">{summary}</Text>
                    <HStack w="40%" justifyContent="flex-end">
                      {
                        status === 'loading' ?
                        <Spinner size="xs" /> :
                        status === 'success' ?
                        <Icon as={IoMdCheckmarkCircleOutline} w={4} h={4} /> :
                        <Icon as={IoMdCloseCircleOutline} w={4} h={4} />
                      }
                      <Link ml={1} href={`https://explorer.${octopusConfig.networkId}.oct.network/${tx.appchainId}/tx/${tx.hash}`} isExternal>
                        <HStack spacing={0}>
                          <Text fontSize="xs">View on Explorer</Text>
                          <ExternalLinkIcon w={3} h={3} />
                        </HStack>
                      </Link>
                    </HStack>
                  </Flex>
                </Box>
              )
            })
          }
        </List>
          <Box pb={4} />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}