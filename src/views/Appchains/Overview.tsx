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
  DrawerHeader,
  CloseButton
} from '@chakra-ui/react';

import {
  AppchainId,
  OriginAppchainInfo,
  AnchorContract,
  AppchainState
} from 'types';

import dayjs from 'dayjs';
import axios from 'axios';

import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { AiOutlineUser, AiOutlineGlobal, AiFillGithub, AiOutlineFileZip } from 'react-icons/ai';
import { FaStar } from 'react-icons/fa';
import { FiAnchor } from 'react-icons/fi';
import { IoMdTime } from 'react-icons/io';
import { ExternalLinkIcon, CopyIcon, CheckIcon, AttachmentIcon } from '@chakra-ui/icons';
import { HiOutlineMail } from 'react-icons/hi';
import { AiOutlineEdit } from 'react-icons/ai';
import { StateBadge, ScoreChart } from 'components';
import StakingPanel from './StakingPanel';
import Permissions from './Permissions';
import { octopusConfig } from 'config';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import { useGlobalStore } from 'stores';

import Decimal from 'decimal.js';

type OverviewProps = {
  appchainId: AppchainId;
  onDrawerClose: VoidFunction;
}

const Overview: React.FC<OverviewProps> = ({ appchainId, onDrawerClose }) => {

  const [appchain, setAppchain] = useState<OriginAppchainInfo>();

  const { hasCopied, onCopy } = useClipboard(appchain?.appchain_metadata?.contact_email);
  const [isOwner, setIsOwner] = useState(false);
  const [accountBalance, setAccountBalance] = useState<Decimal>(ZERO_DECIMAL);
  const toast = useToast();

  const globalStore = useGlobalStore(state => state.globalStore);
  const [counterData, setCounterData] = useState<any>();
  const highestScore = useRef<Decimal>(ZERO_DECIMAL);
  const lowestScore = useRef<Decimal>(
    DecimalUtils.fromNumber(Number.MAX_SAFE_INTEGER)
  );

  const [isEditing, setIsEditing] = useBoolean(false);
  const [isUpdating, setIsUpdating] = useBoolean(false);
  const [appchainMetadata, setAppchainMeataData] = useState<any>({});
  const [ftMetadata, setFTMetadata] = useState<any>({});
  const [isInStaking, setIsInStaking] = useBoolean(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorContract, setAnchorContract] = useState<AnchorContract>();

  useEffect(() => {
    globalStore
      .registryContract
      .get_appchain_status_of({
        appchain_id: appchainId
      })
      .then(appchain => {
        setAppchain(appchain);
        setAppchainMeataData(appchain.appchain_metadata);
        setFTMetadata(appchain.appchain_metadata.fungible_token_metadata);
        setIsOwner(globalStore.accountId === appchain.appchain_owner);
      });
    
  }, [appchainId, globalStore]);

  useEffect(() => {
    
    if (globalStore.accountId) {
      globalStore
        .tokenContract
        .ft_balance_of({
          account_id: globalStore.accountId
        }).then(balance => {
          setAccountBalance(
            DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS)
          );
        });
    }

    globalStore
      .registryContract
      .get_owner()
      .then(owner => {
        setIsAdmin(owner === globalStore.accountId);
      });

    if (appchain?.appchain_anchor) {
      const provider = globalStore.walletConnection?._near.connection.provider;

      provider.query({
        request_type: 'view_code',
        account_id: appchain?.appchain_anchor,
        finality: 'optimistic',
      }).then(_ => {
        const contract = new AnchorContract(
          globalStore.walletConnection.account(),
          appchain?.appchain_anchor,
          {
            viewMethods: [
              'get_appchain_settings',
              'get_validator_deposit_of',
              'get_anchor_status',
              'get_processing_status_of',
              'get_unbonded_stakes_of',
              'get_anchor_settings',
              'get_protocol_settings',
              'get_validator_set_info_of',
              'get_validator_list_of',
              'get_delegator_deposit_of'
            ],
            changeMethods: [
              'unbond_stake',
              'go_booting',
              'go_live',
              'set_rpc_endpoint',
              'set_subql_endpoint',
              'set_era_reward'
            ]
          }
        );

        setAnchorContract(contract);
      });
    }

    if (appchain?.appchain_state === AppchainState.InQueue) {
      axios
        .get(`/api/counter?appchain=${appchain.appchain_id}`)
        .then(res => res.data)
        .then((data: any) => {
          if (data.success) {
            const tmpObj = {}
            data.data.forEach(({ voting_score, created_at }) => {
              const score = DecimalUtils.fromString(voting_score, OCT_TOKEN_DECIMALS);
              if (score.lt(lowestScore.current)) {
                lowestScore.current = score;
              } else if (score.gt(highestScore.current)) {
                highestScore.current = score;
              }
              tmpObj[dayjs(created_at).format('MM-DD')] = score.toNumber();
            });
  
            setCounterData(
              Object.entries(tmpObj).slice(-7).map(([date, score]) => ({ date, score }))
            );
  
          }
        });
    }

  }, [appchain, globalStore]);

  const onUpdate = async () => {
    setIsUpdating.on();

    try {
      // delete appchainMetadata['custom_metadata'];
      await 
        globalStore
          .registryContract
          .update_appchain_metadata({
            appchain_id: appchain.appchain_id,
            ...appchainMetadata,
            fungible_token_metadata: ftMetadata
          });
      
      // we need to wait 1000ms to see then appchain state update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
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

  const onLogin = () => {
    globalStore
      .walletConnection
      .requestSignIn(
        octopusConfig.registryContractId,
        'Octopus Webapp'
      );
  }

  const onAppchainMetadataChange = (k: string, v: string) => {
    setAppchainMeataData(Object.assign({}, appchainMetadata, { [k]: v }));
  }

  const onFTMetadataChange = (k, v, isNumber = false) => {
    setFTMetadata(Object.assign({}, ftMetadata, { [k]: isNumber ? v * 1 : v }));
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
            opacity: isInStaking ? .3 : 1
          }}>
            <HStack>
              <Skeleton isLoaded={!!appchain}>
                <Heading fontSize="3xl">{appchain?.appchain_id || 'loading'}</Heading>
              </Skeleton>
              {
                appchain ?
                  <StateBadge state={appchain.appchain_state} /> : null
              }
            </HStack>
            <Skeleton isLoaded={!!appchain}>
              <HStack color="gray" spacing={5} fontSize="sm">
                <Link isExternal href={`${octopusConfig.nearExplorerUrl}/accounts/${appchain?.appchain_owner}`}>
                  <HStack spacing={1}>
                    <Icon as={AiOutlineUser} />
                    <Text>{appchain?.appchain_owner || 'loading'}</Text>
                  </HStack>
                </Link>

                <HStack spacing={1} display={{ base: 'none', lg: 'flex' }}>
                  <Icon as={IoMdTime} />
                  <Text>
                    {
                      appchain ? dayjs(
                        appchain.registered_time.substr(0, 13) as any * 1
                      ).format('YYYY-MM-DD HH:mm') : 'loading...'
                    }
                  </Text>
                </HStack>

              </HStack>
            </Skeleton>
          </VStack>

          <Permissions onGoStake={setIsInStaking.on} onCancelStake={setIsInStaking.off} isInStaking={isInStaking}
            anchorContract={anchorContract} appchain={appchain} />
        </Flex>
        <Divider mt={3} mb={3} />
        {
          isInStaking ?
            <StakingPanel appchain={appchain} anchorContract={anchorContract} /> :
            <List>
              {
                appchain?.appchain_state === AppchainState.InQueue &&
                <>
                  <Box>
                    <Flex justifyContent="space-between">
                      <HStack fontSize="sm" spacing={1}>
                        <Icon as={FaStar} />
                        <Text>Total Score</Text>
                      </HStack>
                      <Heading fontSize="md" fontWeight={500}>
                        {
                          DecimalUtils.beautify(
                            DecimalUtils.fromString(appchain?.voting_score, OCT_TOKEN_DECIMALS)
                          )
                        }
                      </Heading>
                    </Flex>
                    <Skeleton isLoaded={counterData}>
                      <Box width="100%" height="80px" mt={4}>
                        <ScoreChart data={counterData} highest={highestScore.current.toNumber()}
                          lowest={lowestScore.current.toNumber()} showDate={true} />
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
                !!appchain?.appchain_anchor ?
                <>
                  <Flex justifyContent="space-between">
                    <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                      <Icon as={FiAnchor} />
                      <Text>Anchor</Text>
                    </HStack>
                    <Link href={`${octopusConfig.nearExplorerUrl}/accounts/${appchain?.appchain_anchor}`} isExternal flex={1} overflow="hidden">
                      <HStack justifyContent={{ base: "start", sm: "end" }}>
                        <Heading fontSize="md" fontWeight={500} maxW="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                          {appchainId}.{octopusConfig.registryContractId}
                        </Heading>
                        <ExternalLinkIcon mx="2px" />
                      </HStack>
                    </Link>
                  </Flex>
                  <Divider mt={3} mb={3} />
                </> : null
              }
              {
                isEditing ||
                appchain?.appchain_metadata?.website_url ?
                <>
                  <Flex direction={{ base: "column", sm: "row" }} justifyContent="space-between">
                    <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                      <Icon as={AiOutlineGlobal} />
                      <Text>Website</Text>
                    </HStack>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.website_url}
                          onChange={e => onAppchainMetadataChange('website_url', e.target.value)} width="auto" /> :
                        <Link href={appchain?.appchain_metadata?.website_url} isExternal flex={1} overflow="hidden">
                          <HStack justifyContent={{ base: "start", sm: "end" }}>
                            <Heading fontSize="md" fontWeight={500} maxW="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {appchain?.appchain_metadata?.website_url}
                            </Heading>
                            <ExternalLinkIcon mx="2px" />
                          </HStack>
                        </Link>
                    }
                  </Flex>
                  <Divider mt={3} mb={3} />
                </> : null
              }
              
              <Skeleton isLoaded={!!appchain}>
                <Flex direction={{ base: "column", sm: "row" }} justifyContent="space-between">
                  <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                    <Icon as={AttachmentIcon} />
                    <Text>Function Spec</Text>
                  </HStack>
                  {
                    isEditing ?
                      <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.function_spec_url}
                        onChange={e => onAppchainMetadataChange('function_spec_url', e.target.value)} width="auto" /> :
                        appchain?.appchain_metadata?.function_spec_url ?
                        <Link href={appchain?.appchain_metadata?.function_spec_url} isExternal flex={1} overflow="hidden">
                          <HStack justifyContent={{ base: "start", sm: "end" }}>
                            <Heading fontSize="md" fontWeight={500} maxW="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {appchain?.appchain_metadata?.function_spec_url}
                            </Heading>
                            <ExternalLinkIcon mx="2px" />
                          </HStack>
                        </Link> : null
                  }
                </Flex>
              </Skeleton>
              <Divider mt={3} mb={3} />
              <Skeleton isLoaded={!!appchain}>
                <Flex direction={{ base: "column", sm: "row" }} justifyContent="space-between">
                  <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                    <Icon as={AiFillGithub} />
                    <Text>Github</Text>
                  </HStack>
                  {
                    isEditing ?
                      <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.github_address}
                        onChange={e => onAppchainMetadataChange('github_address', e.target.value)} width="auto" /> :
                      <Link href={appchain?.appchain_metadata?.github_address} isExternal flex={1} overflow="hidden">
                        <HStack justifyContent={{ base: "start", sm: "end" }}>
                          <Heading fontSize="md" fontWeight={500} maxW="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {appchain?.appchain_metadata?.github_address}
                          </Heading>
                          <ExternalLinkIcon mx="2px" />
                        </HStack>
                      </Link>
                  }
                </Flex>
              </Skeleton>
              <Divider mt={3} mb={3} />
              <Skeleton isLoaded={!!appchain}>
                <Flex direction={{ base: "column", sm: "row" }} justifyContent="space-between">
                  <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                    <Icon as={AiOutlineFileZip} />
                    <Text>Release</Text>
                  </HStack>
                  {
                    isEditing ?
                      <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.github_release}
                        onChange={e => onAppchainMetadataChange('github_release', e.target.value)} width="auto" /> :
                      <Link href={appchain?.appchain_metadata?.github_release} isExternal flex={1} overflow="hidden">
                        <HStack justifyContent={{ base: "start", sm: "end" }}>
                          <Heading fontSize="md" fontWeight={500} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {appchain?.appchain_metadata?.github_release}
                          </Heading>
                          <ExternalLinkIcon mx="2px" />
                        </HStack>
                      </Link>
                  }
                </Flex>
              </Skeleton>
              <Divider mt={3} mb={3} />
              <Skeleton isLoaded={!!appchain}>
                <Flex direction={{ base: "column", sm: "row" }} justifyContent="space-between" c>
                  <HStack fontSize="sm" spacing={1} minW="130px" mr={2}>
                    <Icon as={HiOutlineMail} />
                    <Text>Email</Text>
                  </HStack>
                  {
                    isEditing ?
                      <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.contact_email}
                        onChange={e => onAppchainMetadataChange('contact_email', e.target.value)} width="auto" /> :
                      <HStack flex={1} overflow="hidden" justifyContent={{ base: "start", sm: "end" }}>
                        <Heading fontSize="md" fontWeight={500}>{appchain?.appchain_metadata?.contact_email}</Heading>
                        <IconButton size="sm" aria-label="Copy" icon={
                          hasCopied ? <CheckIcon /> : <CopyIcon />
                        } onClick={onCopy} />
                      </HStack>
                  }
                </Flex>
              </Skeleton>

              <Skeleton isLoaded={!!appchain}>

                <List spacing={2} p={3} bg="#f9fafc" borderRadius={5} mt={4}>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Premined Amount</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.premined_wrapped_appchain_token} bg="white"
                          onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token', e.target.value,)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500}>
                            {
                              DecimalUtils.beautify(
                                DecimalUtils.fromString(
                                  appchain?.appchain_metadata?.premined_wrapped_appchain_token
                                ),
                                0
                              )
                            }
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Premined Beneficiary</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary} bg="white"
                          onChange={e => onAppchainMetadataChange('premined_wrapped_appchain_token_beneficiary', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500}>
                            {appchain?.appchain_metadata?.premined_wrapped_appchain_token_beneficiary}
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">IDO Amount</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.ido_amount_of_wrapped_appchain_token} bg="white"
                          onChange={e => onAppchainMetadataChange('ido_amount_of_wrapped_appchain_token', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500}>
                            {
                              
                              DecimalUtils.beautify(
                                DecimalUtils.fromString(appchain?.appchain_metadata?.ido_amount_of_wrapped_appchain_token),
                                0
                              )
                            }
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Era Reward</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.initial_era_reward} bg="white"
                          onChange={e => onAppchainMetadataChange('initial_era_reward', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={600}>
                            {
                              DecimalUtils.beautify(
                                DecimalUtils.fromString(appchain?.appchain_metadata?.initial_era_reward),
                                0
                              )
                            }
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Divider />
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Token Name</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.fungible_token_metadata?.name} bg="white"
                          onChange={e => onFTMetadataChange('name', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500}>
                            {appchain?.appchain_metadata?.fungible_token_metadata?.name}
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Token Symbol</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.fungible_token_metadata?.symbol} bg="white"
                          onChange={e => onFTMetadataChange('symbol', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500}>
                            {appchain?.appchain_metadata?.fungible_token_metadata?.symbol}
                          </Heading>
                        </HStack>
                    }
                  </Flex>

                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Icon</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.fungible_token_metadata?.icon} bg="white"
                          onChange={e => onFTMetadataChange('icon', e.target.value)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="sm" fontWeight={500} maxWidth={200} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {appchain?.appchain_metadata?.fungible_token_metadata?.icon}
                          </Heading>
                        </HStack>
                    }
                  </Flex>
                  <Flex justifyContent="space-between" fontSize="sm">
                    <Text fontSize="xs">Decimals</Text>
                    {
                      isEditing ?
                        <Input disabled={isUpdating} defaultValue={appchain?.appchain_metadata?.fungible_token_metadata?.decimals} bg="white"
                          onChange={e => onFTMetadataChange('decimals', e.target.value, true)} width="auto" size="sm" /> :
                        <HStack>
                          <Heading fontSize="md" fontWeight={500}>
                            {appchain?.appchain_metadata?.fungible_token_metadata?.decimals}
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
          globalStore.accountId ?
            <VStack alignItems="flex-end" spacing={0}>
              <HStack>
                <Avatar size="sm" />
                <VStack spacing={-1} alignItems="flex-start">
                  <HStack>
                    <Text>{globalStore.accountId}</Text>
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
                  <Text fontSize="xs" color="gray">
                    Balance: {
                      accountBalance === undefined ? 
                      <Spinner size="sm" /> : 
                      DecimalUtils.beautify(accountBalance)
                    } OCT</Text>
                </VStack>
              </HStack>

            </VStack> :
            <Button size="sm" onClick={onLogin}>
              <Avatar size="xs" mr="1" />
              <Text color="gray">Login</Text>
            </Button>
        }
      </DrawerFooter>
    </>

  );
}

export default Overview;