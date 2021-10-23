import React, { useEffect, useState, useRef } from 'react';

import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Link,
  Icon,
  Divider,
  Skeleton,
  Flex,
  List,
  useClipboard,
  IconButton,
  DrawerBody,
  DrawerFooter,
  Avatar,
  Badge,
  Button,
  useBoolean,
  Input,
  useToast,
  Tooltip,
  Spinner,
  Fade,
  DrawerHeader,
  CloseButton
} from '@chakra-ui/react';

import dayjs from 'dayjs';
import axios from 'axios';
import { Contract } from 'near-api-js';
import { loginNear, fromDecimals } from 'utils';
import { AiOutlineUser, AiOutlineGlobal, AiFillGithub, AiOutlineFileZip } from 'react-icons/ai';
import { FaStar } from 'react-icons/fa';
import { IoMdTime } from 'react-icons/io';
import { ExternalLinkIcon, CopyIcon, CheckIcon, AttachmentIcon } from '@chakra-ui/icons';
import { HiOutlineMail } from 'react-icons/hi';
import { AiOutlineEdit } from 'react-icons/ai';
import StateBadge from 'components/StateBadge';
import ScoreChart from 'components/ScoreChart';
import StakingPanel from './StakingPanel';
import Permissions from './Permissions';
import octopusConfig from 'config/octopus';

const Overview = ({ appchainId, onDrawerClose }) => {

  const [appchainStatus, setAppchainStatus] = useState<any>();
  const { hasCopied, onCopy } = useClipboard(appchainStatus?.appchain_metadata?.contact_email);
  const [isOwner, setIsOwner] = useState(false);
  const [accountBalance, setAccountBalance] = useState<any>();
  const toast = useToast();

  const [counterData, setCounterData] = useState();
  const highestScore = useRef(0);
  const lowestScore = useRef(Number.MAX_SAFE_INTEGER);

  const [isEditing, setIsEditing] = useBoolean(false);
  const [isUpdating, setIsUpdating] = useBoolean(false);
  const [appchainMetadata, setAppchainMeataData] = useState<any>({});
  const [ftMetadata, setFTMetadata] = useState<any>({});
  const [inStaking, setInStaking] = useBoolean(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [anchor, setAnchor] = useState<Contract>();

  useEffect(() => {
    axios.get( `/api/counter?appchain=${appchainId}`)
      .then(res => res.data)
      .then((data: any) => {
        if (data.success) {
          setCounterData(data.data.map(({ voting_score, created_at }) => {
            const score = fromDecimals(voting_score);
            if (score < lowestScore.current) {
              lowestScore.current = score;
            } else if (score > highestScore.current) {
              highestScore.current = score;
            }
            return {
              date: dayjs(created_at).format('MM-DD'),
              score
            }
          }));
        }
      });

    window
      .tokenContract
      .ft_balance_of({
        account_id: window.accountId
      }).then(balance => {
        setAccountBalance(fromDecimals(balance));
      });

    window
      .registryContract
      .get_owner()
      .then(owner => {
        setIsAdmin(owner === window.accountId);
      });

    const provider = window.walletConnection._near.connection.provider;
    const anchorContractId = `${appchainId}.${octopusConfig.registryContractId}`;
    provider.query({
      request_type: 'view_code',
      account_id: anchorContractId,
      finality: 'optimistic',
    }).then(res => {
      const contract = new Contract(
        window.walletConnection.account(),
        anchorContractId,
        {
          viewMethods: [
            'get_validator_deposit_of',
            'get_anchor_status',
            'get_processing_status_of',
            'get_anchor_settings',
            'get_protocol_settings',
            'get_validator_set_info_of',
            'get_validator_list_of_era'
          ],
          changeMethods: []
        }
      );
      setAnchor(contract);
    }).catch(err => {
      setAnchor(null);
      console.log('No anchor');
    });

  }, [appchainId]);
  
  useEffect(() => {
    window
      .registryContract
      .get_appchain_status_of({
        appchain_id: appchainId
      })
      .then(status => {
        setAppchainStatus(status);
        setAppchainMeataData(status.appchain_metadata);
        setFTMetadata(status.appchain_metadata.fungible_token_metadata);
        setIsOwner(window.accountId && status?.appchain_owner === window.accountId);
      });
  }, [appchainId]);

  const onUpdate = async () => {
    setIsUpdating.on();
    
    try {
      // delete appchainMetadata['custom_metadata'];
      await window
        .registryContract
        .update_appchain_metadata({
          appchain_id: appchainId,
          ...appchainMetadata,
          fungible_token_metadata: ftMetadata
        });

      window.location.reload();
    } catch(err) {
      setIsEditing.off();
      setIsUpdating.off();
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }
  }

  const onAppchainMetadataChange = (k, v, isNumber = false) => {
    setAppchainMeataData(Object.assign({}, appchainMetadata, {[k]: v}));
  }

  const onFTMetadataChange = (k, v, isNumber = false) => {
    setFTMetadata(Object.assign({}, ftMetadata, {[k]: isNumber ? v * 1 : v}));
  }

  return (

    <>
    
    <DrawerHeader borderBottomWidth="0">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="xl"></Heading>
        <CloseButton onClick={onDrawerClose} />
      </Flex>
    </DrawerHeader>

    <DrawerBody>
      <Flex justifyContent="space-between" alignItems="center">
        
        <VStack alignItems="flex-start" spacing={1} style={{
          transition: 'opacity .3s ease',
          opacity: inStaking ? '.3' : 1
        }}>
          <HStack>
            <Skeleton isLoaded={!!appchainStatus}>
              <Heading fontSize="3xl">{appchainStatus?.appchain_id || 'loading...'}</Heading>
            </Skeleton>
            <StateBadge state={appchainStatus?.appchain_state} />
          </HStack>
          <Skeleton isLoaded={!!appchainStatus}>
            <HStack color="gray" spacing={5} fontSize="sm">
              <Link isExternal href={`${octopusConfig.explorerUrl}/accounts/${appchainStatus?.appchain_owner}`}>
                <HStack spacing={1}>
                  <Icon as={AiOutlineUser} />
                  <Text>{appchainStatus?.appchain_owner || 'loading...'}</Text>
                </HStack>
              </Link>
              <HStack spacing={1}>
                <Icon as={IoMdTime} />
                <Text>
                  {
                    appchainStatus ? dayjs(
                      appchainStatus.registered_time.substr(0, 13) * 1
                    ).format('YYYY-MM-DD HH:mm') : 'loading...'
                  }
                </Text>
              </HStack>
            </HStack>
          </Skeleton>
        </VStack>

        <Permissions onGoStake={setInStaking.on} onCancelStake={setInStaking.off} inStaking={inStaking}
          anchor={anchor} status={appchainStatus} />
      </Flex>
      <Divider mt={3} mb={3} />
      {
        inStaking ?
        <StakingPanel status={appchainStatus} anchor={anchor} /> :
        <List>
          {
            appchainStatus?.appchain_state === 'InQueue' &&
            <>
            <Box>
              <Flex justifyContent="space-between">
                <HStack fontSize="sm" spacing={1}>
                  <Icon as={FaStar} />
                  <Text>Total Score</Text>
                </HStack>
                <Heading fontSize="md" fontWeight={500}>{fromDecimals(appchainStatus?.voting_score).toFixed(2)}</Heading>
              </Flex>
              <Skeleton isLoaded={counterData}>
              <Box width="100%" height="80px" mt={4}>
                <ScoreChart data={counterData} highest={highestScore.current} 
                  lowest={lowestScore.current} showDate={true} />
              </Box>
              </Skeleton>
            </Box>
            <Divider mt={3} mb={3} />
            </>
          }
          {
            isAdmin ?
            <Flex justifyContent="flex-end" h="50px" alignItems="center">
              {
                isEditing ?
                <HStack>
                <Button onClick={setIsEditing.off} variant="ghost" isDisabled={isUpdating} size="sm">Cancel</Button>
                <Button onClick={onUpdate} isDisabled={isUpdating} size="sm"
                  isLoading={isUpdating} colorScheme="octoColor">
                  Update
                </Button>
                </HStack> :
                <Button onClick={setIsEditing.on} size="sm">
                  <Icon as={AiOutlineEdit} mr={1} /> Edit
                </Button>
              }
            </Flex> : null
          }
          {
            appchainStatus?.appchain_metadata?.website_url &&
            <>
            <Flex justifyContent="space-between">
              <HStack fontSize="sm" spacing={1}>
                <Icon as={AiOutlineGlobal} />
                <Text>Website</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.website_url} 
                  onChange={e => onAppchainMetadataChange('website_url', e.target.value)} width="auto" /> :
                <Link href={appchainStatus?.appchain_metadata?.website_url} isExternal>
                  <HStack>
                    <Heading fontSize="md" fontWeight={500} maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {appchainStatus?.appchain_metadata?.website_url}
                    </Heading>
                    <ExternalLinkIcon mx="2px" />
                  </HStack>
                </Link>
              }
            </Flex>
            <Divider mt={3} mb={3} />
            </>
          }
          <Skeleton isLoaded={!!appchainStatus}>
            <Flex justifyContent="space-between">
              <HStack fontSize="sm" spacing={1}>
                <Icon as={AttachmentIcon} />
                <Text>Function Spec</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.function_spec_url} 
                  onChange={e => onAppchainMetadataChange('function_spec_url', e.target.value)} width="auto" /> :
                appchainStatus?.appchain_metadata?.function_spec_url ?
                <Link href={appchainStatus?.appchain_metadata?.function_spec_url} isExternal>
                  <HStack>
                    <Heading fontSize="md" fontWeight={500} maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {appchainStatus?.appchain_metadata?.function_spec_url}
                    </Heading>
                    <ExternalLinkIcon mx="2px" />
                  </HStack>
                </Link> : null
              }
            </Flex>
          </Skeleton>
          <Divider mt={3} mb={3} />
          <Skeleton isLoaded={!!appchainStatus}>
            <Flex justifyContent="space-between">
              <HStack fontSize="sm" spacing={1}>
                <Icon as={AiFillGithub} />
                <Text>Github</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_address} 
                  onChange={e => onAppchainMetadataChange('github_address', e.target.value)} width="auto" /> :
                <Link href={appchainStatus?.appchain_metadata?.github_address} isExternal>
                  <HStack>
                    <Heading fontSize="md" fontWeight={500} maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {appchainStatus?.appchain_metadata?.github_address}
                    </Heading>
                    <ExternalLinkIcon mx="2px" />
                  </HStack>
                </Link>
              }
            </Flex>
          </Skeleton>
          <Divider mt={3} mb={3} />
          <Skeleton isLoaded={!!appchainStatus}>
            <Flex justifyContent="space-between">
              <HStack fontSize="sm" spacing={1}>
                <Icon as={AiOutlineFileZip} />
                <Text>Release</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_release} 
                  onChange={e => onAppchainMetadataChange('github_release', e.target.value)} width="auto" /> :
                <Link href={appchainStatus?.appchain_metadata?.github_release} isExternal>
                  <HStack>
                    <Heading fontSize="md" fontWeight={500} maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {appchainStatus?.appchain_metadata?.github_release}
                    </Heading>
                    <ExternalLinkIcon mx="2px" />
                  </HStack>
                </Link>
              }
            </Flex>
          </Skeleton>
          <Divider mt={3} mb={3} />
          <Skeleton isLoaded={!!appchainStatus}>
            <Flex justifyContent="space-between"c>
              <HStack fontSize="sm" spacing={1}>
                <Icon as={HiOutlineMail} />
                <Text>Email</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.contact_email} 
                  onChange={e => onAppchainMetadataChange('contact_email', e.target.value)} width="auto" /> :
                <HStack>
                  <Heading fontSize="md" fontWeight={500}>{appchainStatus?.appchain_metadata?.contact_email}</Heading>
                  <IconButton size="sm" aria-label="Copy" icon={
                    hasCopied ? <CheckIcon />: <CopyIcon />
                  } onClick={onCopy} />
                </HStack>
              }
            </Flex>
          </Skeleton>
          
          <Skeleton isLoaded={!!appchainStatus}>
            
            <List spacing={2} p={3} bg="#f9fafc" borderRadius={5} mt={4}>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Premined Amount</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token} bg="white" 
                    onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token', e.target.value, true)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Premined Beneficiary</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary} bg="white" 
                    onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token_beneficiary', e.target.value)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">IDO Amount</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.ido_amount_of_wrapped_appchain_token} bg="white"
                    onChange={e => onAppchainMetadataChange('ido_amount_of_wrapped_appchain_token', e.target.value, true)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.ido_amount_of_wrapped_appchain_token}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Era Reward</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.initial_era_reward} bg="white"
                    onChange={e => onAppchainMetadataChange('initial_era_reward', e.target.value, true)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={600}>
                      {appchainStatus?.appchain_metadata?.initial_era_reward}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Divider />
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Token Name</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.name} bg="white"
                    onChange={e => onFTMetadataChange('name', e.target.value)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.fungible_token_metadata?.name}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Token Symbol</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.symbol} bg="white"
                    onChange={e => onFTMetadataChange('symbol', e.target.value)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.fungible_token_metadata?.symbol}
                    </Heading>
                  </HStack>
                }
              </Flex>
            
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Icon</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.icon} bg="white"
                    onChange={e => onFTMetadataChange('icon', e.target.value)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="sm" fontWeight={500} maxWidth={200} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {appchainStatus?.appchain_metadata?.fungible_token_metadata?.icon}
                    </Heading>
                  </HStack>
                }
              </Flex>
              <Flex justifyContent="space-between" fontSize="sm">
                <Text fontSize="xs">Decimals</Text>
                {
                  isEditing ?
                  <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.decimals} bg="white"
                    onChange={e => onFTMetadataChange('decimals', e.target.value, true)} width="auto" size="sm" /> :
                  <HStack>
                    <Heading fontSize="md" fontWeight={500}>
                      {appchainStatus?.appchain_metadata?.fungible_token_metadata?.decimals}
                    </Heading>
                  </HStack>
                }
              </Flex>
            </List>
            
            
          </Skeleton>
        </List>
      }
      
    </DrawerBody>
    <DrawerFooter bg="rgba(120, 120, 150, .08)">
      {
        window.accountId ?
        <VStack alignItems="flex-end" spacing={0}>
          <HStack>
            <Avatar size="sm" />
            <VStack spacing={-1} alignItems="flex-start">
              <HStack>
                <Text>{window.accountId}</Text>
                { 
                  isOwner && 
                  <Tooltip label="Owner of this appchain">
                    <Badge colorScheme="green">Owner</Badge>
                  </Tooltip>
                }
                { 
                  isAdmin && 
                  <Tooltip label="Admin of Octopus Registry">
                    <Badge colorScheme="purple">Admin</Badge>
                  </Tooltip>
                }
              </HStack>
              <Text fontSize="xs" color="gray">Balance: {accountBalance === undefined ? <Spinner size="sm" /> : accountBalance } OCT</Text>
            </VStack>
          </HStack>
          
        </VStack> :
        <Button size="sm" onClick={loginNear}>
          <Avatar size="xs" mr="1" />
          <Text color="gray">Login</Text>
        </Button>
      }
    </DrawerFooter>
    </>
  
  );
}

export default Overview;