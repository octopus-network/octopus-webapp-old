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
  Spinner
} from '@chakra-ui/react';

import dayjs from 'dayjs';
import axios from 'axios';
import { loginNear, fromDecimals } from 'utils';
import { AiOutlineUser, AiOutlineGlobal, AiFillGithub, AiOutlineFileZip } from 'react-icons/ai';
import { FaStar } from 'react-icons/fa';
import { GrUserWorker } from 'react-icons/gr';
import { IoMdTime } from 'react-icons/io';
import { RiHandCoinLine, RiExchangeFundsFill, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { ExternalLinkIcon, CopyIcon, CheckIcon, AttachmentIcon } from '@chakra-ui/icons';
import { HiOutlineMail } from 'react-icons/hi';
import { AiOutlineEdit } from 'react-icons/ai';
import StateBadge from 'components/StateBadge';
import ScoreChart from 'components/ScoreChart';
import Permissions from './Permissions';
import octopusConfig from 'config/octopus';

const Overview = ({ appchainId }) => {

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

  // const isAdmin = window.accountId && (
  //   new RegExp(`\.${window.accountId}`).test(octopusConfig.registryContractId) ||
  //   window.accountId === octopusConfig.registryContractId
  // );
  const [isAdmin, setIsAdmin] = useState(false);

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
  }, []);
  
  useEffect(() => {
    window
      .registryContract
      .get_appchain_status_of({
        appchain_id: appchainId
      })
      .then(status => {
        console.log(status);
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
    <DrawerBody>
      <Flex justifyContent="space-between" alignItems="center">
        <VStack alignItems="flex-start" spacing="3">
          <HStack>
            <Skeleton isLoaded={!!appchainStatus}>
              <Heading fontSize="3xl">{appchainStatus?.appchain_id || 'loading...'}</Heading>
            </Skeleton>
            <StateBadge state={appchainStatus?.appchain_state} />
          </HStack>
          <Skeleton isLoaded={!!appchainStatus}>
            <HStack color="gray" spacing={5} fontSize="sm">
              <Link isExternal href={`${octopusConfig.explorerUrl}/accounts/${appchainStatus?.appchain_owner}`}>
                <HStack>
                  <Icon as={AiOutlineUser} />
                  <Text>{appchainStatus?.appchain_owner || 'loading...'}</Text>
                </HStack>
              </Link>
              <HStack>
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
        <Permissions status={appchainStatus} onEdit={setIsEditing.on} onUpdate={onUpdate} onCancelEdit={setIsEditing.off} />
      </Flex>
      <Divider mt="6" mb="6" />
      <List>
        {
          appchainStatus?.appchain_state === 'InQueue' &&
          <>
          <Box>
            <Flex justifyContent="space-between">
              <HStack>
                <Icon as={FaStar} w={5} h={5} />
                <Text>Total Score</Text>
              </HStack>
              <Box borderRadius={30} border="1px solid #ccc" p="2px 8px" fontSize="sm">
                {fromDecimals(appchainStatus?.voting_score).toFixed(2)}
              </Box>
            </Flex>
            <Skeleton isLoaded={counterData}>
            <Box width="100%" height="80px" mt={4}>
              <ScoreChart data={counterData} highest={highestScore.current} 
                lowest={lowestScore.current} showDate={true} />
            </Box>
            </Skeleton>
          </Box>
          <Divider mt="4" mb="4" />
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
                <Icon as={AiOutlineEdit} mr="1" /> Edit
              </Button>
            }
          </Flex> : null
        }
        {
          appchainStatus?.appchain_metadata?.website_url &&
          <>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineGlobal} w={5} h={5} />
              <Text>Website</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.website_url} 
                onChange={e => onAppchainMetadataChange('website_url', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.website_url} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.website_url}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link>
            }
          </Flex>
          <Divider mt="4" mb="4" />
          </>
        }
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AttachmentIcon} w={5} h={5} />
              <Text>Function Spec</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.function_spec_url} 
                onChange={e => onAppchainMetadataChange('function_spec_url', e.target.value)} width="auto" /> :
              appchainStatus?.appchain_metadata?.function_spec_url ?
              <Link href={appchainStatus?.appchain_metadata?.function_spec_url} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.function_spec_url}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link> : null
            }
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiFillGithub} w={5} h={5} />
              <Text>Github</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_address} 
                onChange={e => onAppchainMetadataChange('github_address', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.github_address} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.github_address}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link>
            }
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineFileZip} w={5} h={5} />
              <Text>Release</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_release} 
                onChange={e => onAppchainMetadataChange('github_release', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.github_release} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.github_release}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link>
            }
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between"c>
            <HStack>
              <Icon as={HiOutlineMail} w={5} h={5} />
              <Text>Email</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.contact_email} 
                onChange={e => onAppchainMetadataChange('contact_email', e.target.value)} width="auto" /> :
              <HStack>
                <Text>{appchainStatus?.appchain_metadata?.contact_email}</Text>
                <IconButton size="sm" aria-label="Copy" icon={
                  hasCopied ? <CheckIcon />: <CopyIcon />
                } onClick={onCopy} />
              </HStack>
            }
          </Flex>
        </Skeleton>
        
        <Skeleton isLoaded={!!appchainStatus}>
          
          <List spacing={2} p={4} bg="#f9fafc" borderRadius={5} mt={4}>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                {/* <Icon as={RiHandCoinLine} w={5} h={5} /> */}
                <Text>Premined Amount</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token} bg="white" 
                  onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token', e.target.value, true)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token}</Text>
                </HStack>
              }
            </Flex>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                {/* <Icon as={GrUserWorker} w={5} h={5} /> */}
                <Text>Premined Beneficiary</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary} bg="white" 
                  onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token_beneficiary', e.target.value)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary}</Text>
                </HStack>
              }
            </Flex>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                {/* <Icon as={RiExchangeFundsFill} w={5} h={5} /> */}
                <Text>IDO Amount</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.ido_amount_of_wrapped_appchain_token} bg="white"
                  onChange={e => onAppchainMetadataChange('ido_amount_of_wrapped_appchain_token', e.target.value, true)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.ido_amount_of_wrapped_appchain_token}</Text>
                </HStack>
              }
            </Flex>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                {/* <Icon as={RiMoneyDollarCircleLine} w={5} h={5} /> */}
                <Text>Era Reward</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.initial_era_reward} bg="white"
                  onChange={e => onAppchainMetadataChange('initial_era_reward', e.target.value, true)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.initial_era_reward}</Text>
                </HStack>
              }
            </Flex>
            <Divider mt={4} mb={4} />
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                <Text>Token Name</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.name} bg="white"
                  onChange={e => onFTMetadataChange('name', e.target.value)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.fungible_token_metadata?.name}</Text>
                </HStack>
              }
            </Flex>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                <Text>Token Symbol</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.symbol} bg="white"
                  onChange={e => onFTMetadataChange('symbol', e.target.value)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.fungible_token_metadata?.symbol}</Text>
                </HStack>
              }
            </Flex>
           
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                <Text>Icon</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.icon} bg="white"
                  onChange={e => onFTMetadataChange('icon', e.target.value)} width="auto" size="sm" /> :
                <HStack>
                  <Text maxWidth={200} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{appchainStatus?.appchain_metadata?.fungible_token_metadata?.icon}</Text>
                </HStack>
              }
            </Flex>
            <Flex justifyContent="space-between" fontSize="sm">
              <HStack>
                <Text>Decimals</Text>
              </HStack>
              {
                isEditing ?
                <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.fungible_token_metadata?.decimals} bg="white"
                  onChange={e => onFTMetadataChange('decimals', e.target.value, true)} width="auto" size="sm" /> :
                <HStack>
                  <Text>{appchainStatus?.appchain_metadata?.fungible_token_metadata?.decimals}</Text>
                </HStack>
              }
            </Flex>
          </List>
          
          
        </Skeleton>
      </List>
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