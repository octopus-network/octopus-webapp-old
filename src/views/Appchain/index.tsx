import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

import {
  Container,
  Box,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  HStack,
  VStack,
  SimpleGrid,
  GridItem,
  Wrap,
  WrapItem,
  Text,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Link,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  CircularProgress,
  useClipboard,
  Spinner,
  Icon,
  Center,
  useInterval
} from '@chakra-ui/react';

import {
  AiOutlineUser,
  AiOutlineGlobal,
  AiFillGithub,
  AiOutlineSearch,
  AiOutlineSwap
} from 'react-icons/ai';

import {
  AppchainInfo,
  AnchorContract,
  AppchainSettings,
  AppchainState
} from 'types';

import {
  ExternalLinkIcon,
  AttachmentIcon,
  CheckIcon,
  CopyIcon,
  QuestionOutlineIcon
} from '@chakra-ui/icons';

import {
  ValidatorsTable,
  StateBadge
} from 'components';

import { useParams, Link as RouterLink } from 'react-router-dom';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';

import { IoMdTime } from 'react-icons/io';
import { octopusConfig } from 'config';
import { OCT_TOKEN_DECIMALS, EPOCH_DURATION_MS } from 'primitives';
import { useGlobalStore } from 'stores';
import Decimal from 'decimal.js';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';

import { NodePanel } from './NodePanel';
import { StakingPanel } from './StakingPanel';

dayjs.extend(duration);

export const Appchain: React.FC = () => {
  const { id } = useParams();

  const [appchainInfo, setAppchainInfo] = useState<AppchainInfo>();
  const [anchorContract, setAnchorContract] = useState<AnchorContract>();

  const [apiPromise, setApiPromise] = useState<ApiPromise>();
  const [bestBlock, setBestBlock] = useState(0);
  const [totalIssuance, setTotalIssuance] = useState(ZERO_DECIMAL);

  const [appchainSettings, setAppchainSettings] = useState<AppchainSettings>();
  const [currentEra, setCurrentEra] = useState<number>();
  const [nextEraTime, setNextEraTime] = useState(0);
  const [nextEraTimeLeft, setNextEraTimeLeft] = useState(0);

  const globalStore = useGlobalStore(state => state.globalStore);
  const { hasCopied: rpcEndpointCopied, onCopy: onRpcEndpointCopy } = useClipboard(appchainSettings?.rpcEndpoint);

  useEffect(() => {

    globalStore
      .registryContract
      .get_appchain_status_of({
        appchain_id: id
      })
      .then(({
        appchain_anchor,
        appchain_id,
        appchain_owner,
        appchain_state,
        go_live_time,
        registered_time,
        validator_count,
        downvote_deposit,
        register_deposit,
        total_stake,
        upvote_deposit,
        voting_score,
        appchain_metadata
      }) => {

        setAppchainInfo({
          appchainAnchor: appchain_anchor,
          appchainId: appchain_id,
          appchainOwner: appchain_owner,
          appchainState: appchain_state,
          validatorCount: validator_count,
          goLiveTime: go_live_time,
          registeredTime: registered_time,
          downvoteDeposit: DecimalUtils.fromString(downvote_deposit, OCT_TOKEN_DECIMALS),
          registerDeposit: DecimalUtils.fromString(register_deposit, OCT_TOKEN_DECIMALS),
          totalStake: DecimalUtils.fromString(total_stake, OCT_TOKEN_DECIMALS),
          upvoteDeposit: DecimalUtils.fromString(upvote_deposit, OCT_TOKEN_DECIMALS),
          votingScore: DecimalUtils.fromString(voting_score, OCT_TOKEN_DECIMALS),
          appchainMetadata: {
            contactEmail: appchain_metadata.contact_email,
            customMetadata: appchain_metadata.custom_metadata,
            functionSpecUrl: appchain_metadata.function_spec_url,
            fungibleTokenMetadata: appchain_metadata.fungible_token_metadata,
            githubAddress: appchain_metadata.github_address,
            githubRelease: appchain_metadata.github_release,
            idoAmountOfWrappedAppchainToken: DecimalUtils.fromString(
              appchain_metadata.ido_amount_of_wrapped_appchain_token
            ),
            initialEraReward: DecimalUtils.fromString(
              appchain_metadata.initial_era_reward
            ),
            preminedWrappedAppchainToken: DecimalUtils.fromString(
              appchain_metadata.premined_wrapped_appchain_token
            ),
            preminedWrappedAppchainTokenBeneficiary: appchain_metadata.premined_wrapped_appchain_token_beneficiary,
            websiteUrl: appchain_metadata.website_url
          }
        });

        if (appchain_anchor) {
          const contract = new AnchorContract(
            globalStore.walletConnection.account(),
            appchain_anchor,
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
                'get_delegator_deposit_of',
                'get_index_range_of_staking_history',
                'get_validator_rewards_of',
                'get_delegator_rewards_of',
                'get_wrapped_appchain_token',
                'get_user_staking_histories_of'
              ],
              changeMethods: [
                'unbond_stake',
                'withdraw_stake',
                'unbond_delegation',
                'enable_delegation',
                'disable_delegation',
                'decrease_delegation',
                'decrease_stake',
                'go_booting',
                'go_live',
                'set_rpc_endpoint',
                'set_subql_endpoint',
                'set_era_reward',
                'withdraw_validator_rewards',
                'withdraw_delegator_rewards'
              ]
            }
          );

          setAnchorContract(contract);
        }
      });

  }, [id, globalStore]);

  useEffect(() => {
    if (!anchorContract) {
      return;
    }

    let unsubNewHeads = () => { };
    let unsubNewFinalizedHeads = () => { };

    anchorContract
      .get_appchain_settings()
      .then(({ rpc_endpoint, era_reward, subql_endpoint }) => {
        setAppchainSettings({
          rpcEndpoint: rpc_endpoint,
          eraReward: DecimalUtils.fromString(
            era_reward,
            appchainInfo.appchainMetadata.fungibleTokenMetadata.decimals
          ),
          subqlEndpoint: subql_endpoint
        });

        try {
          const provider = new WsProvider(rpc_endpoint);
          const api = new ApiPromise({ provider });

          api.on('ready', async () => {

            api.rpc.chain.subscribeNewHeads((lastHeader) => {
              setBestBlock(lastHeader.number.toNumber());
            }).then(unsub => {
              unsubNewHeads = unsub;
            });

            const [era, amount]: any = await Promise.all([
              api.query.octopusLpos.activeEra(),
              api.query.balances?.totalIssuance()
            ]);

            const eraJSON = era.toJSON();

            setCurrentEra(eraJSON?.index);
            setNextEraTime(eraJSON ? EPOCH_DURATION_MS + eraJSON.start : 0);
            setNextEraTimeLeft(eraJSON ? (eraJSON.start + EPOCH_DURATION_MS) - new Date().getTime() : 0);

            setTotalIssuance(
              DecimalUtils.fromString(
                amount.toString(),
                api.registry.chainDecimals[0]
              )
            );
          });

          api.isReady.then(api => {
            setApiPromise(api);
          });

        } catch (err) {
          console.log(err);
        }

      });

    return () => {
      unsubNewHeads();
      unsubNewFinalizedHeads();
    }
  }, [anchorContract, appchainInfo]);

  const updateNextEraTimeLeft = useCallback(() => {
    setNextEraTimeLeft(nextEraTimeLeft - 1000);
  }, [nextEraTimeLeft]);

  useInterval(updateNextEraTimeLeft, 1000);

  return (
    <>
      <Container mt={6} mb={6} maxW="container.xl">
        <Box>
          <Breadcrumb fontSize="sm">
            <BreadcrumbItem color="gray">
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem color="gray">
              <BreadcrumbLink href="/appchains">Appchains</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink href="#">{id}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <SimpleGrid columns={{ base: 3, lg: 9 }} mt={6} gap={12} p={6} bg="white" boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px" borderRadius="xl">
          <GridItem colSpan={3}>
            <HStack spacing={3}>
              <Avatar
                size="sm"
                src={appchainInfo?.appchainMetadata.fungibleTokenMetadata?.icon}
                name={appchainInfo?.appchainId}
                bg={appchainInfo?.appchainMetadata.fungibleTokenMetadata?.icon ? 'transparent' : 'blue.100'} />
              <Heading fontSize="3xl">{id}</Heading>
              <StateBadge state={appchainInfo?.appchainState} />
            </HStack>
            <HStack mt={3}>
              <Skeleton isLoaded={!!appchainInfo}>
                <HStack spacing={3}>
                  <Link isExternal color="gray"
                    href={`${octopusConfig.nearExplorerUrl}/accounts/${appchainInfo?.appchainOwner}`}>
                    <HStack spacing={1}>
                      <Icon as={AiOutlineUser} />
                      <Text fontSize="xs">{appchainInfo?.appchainOwner || 'loading'}</Text>
                    </HStack>
                  </Link>
                  <HStack color="gray" spacing={1}>
                    <Icon as={IoMdTime} />
                    <Text fontSize="xs">
                      {
                        appchainInfo ?
                          dayjs(
                            appchainInfo.registeredTime.substr(0, 13) as any * 1
                          ).format('YYYY-MM-DD HH:mm') :
                          'loading'
                      }
                    </Text>
                  </HStack>
                </HStack>
              </Skeleton>
            </HStack>
            <Wrap mt={6}>
              <WrapItem>
                <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.websiteUrl}>
                  <HStack>
                    <Icon as={AiOutlineGlobal} />
                    <Text fontSize="xs">Website</Text>
                    <ExternalLinkIcon color="gray" />
                  </HStack>
                </Button>
              </WrapItem>
              <WrapItem>
                <Button size="sm" as={Link} isExternal href={`${octopusConfig.octExplorerUrl}?appchain=${id}`}>
                  <HStack>
                    <Icon as={AiOutlineSearch} />
                    <Text fontSize="xs">Explorer</Text>
                    <ExternalLinkIcon color="gray" />
                  </HStack>
                </Button>
              </WrapItem>
              {
                appchainInfo?.appchainState === AppchainState.Active ?
                  <WrapItem>
                    <Button size="sm" as={RouterLink} to={`/bridge/${appchainInfo?.appchainId}`}>
                      <HStack>
                        <Icon as={AiOutlineSwap} />
                        <Text fontSize="xs">Bridge</Text>

                      </HStack>
                    </Button>
                  </WrapItem> : null
              }
              <WrapItem>
                <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.functionSpecUrl}>
                  <HStack>
                    <Icon as={AttachmentIcon} />
                    <Text fontSize="xs">Function Spec</Text>
                    <ExternalLinkIcon color="gray" />
                  </HStack>
                </Button>
              </WrapItem>
              <WrapItem>
                <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.githubAddress}>
                  <HStack>
                    <Icon as={AiFillGithub} />
                    <Text fontSize="xs">Github</Text>
                    <ExternalLinkIcon color="gray" />
                  </HStack>
                </Button>
              </WrapItem>
            </Wrap>
          </GridItem>
          <GridItem colSpan={6} display={{ base: 'none', lg: 'block' }}>

            <SimpleGrid columns={17}>
              <GridItem colSpan={6}>
                <Skeleton isLoaded={!!appchainSettings}>
                  <VStack alignItems="flex-start" spacing={1}>
                    <Text fontSize="xs" color="gray">Rpc Endpoint</Text>
                    <HStack w="100%">
                      <Heading fontSize="sm" whiteSpace="nowrap"
                        overflow="hidden" textOverflow="ellipsis" w="calc(100% - 40px)">
                        {appchainSettings?.rpcEndpoint || 'loading'}
                      </Heading>
                      <IconButton aria-label="copy" size="xs" onClick={onRpcEndpointCopy}>
                        {rpcEndpointCopied ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </HStack>
                  </VStack>
                </Skeleton>

                <Flex mt={3}>
                  <VStack alignItems="flex-start" spacing={1}>
                    <Text fontSize="xs" color="gray">Current Era</Text>
                    {
                      currentEra !== undefined ?
                        <Heading fontSize="sm">
                          {DecimalUtils.beautify(new Decimal(currentEra), 0)}
                        </Heading> : <Spinner size="sm" />
                    }
                  </VStack>

                  <VStack alignItems="flex-start" spacing={1} ml={12}>
                    <Text fontSize="xs" color="gray">Next Era</Text>
                    {
                      nextEraTimeLeft > 0 ?
                        <Tooltip label={dayjs(nextEraTime).format('YYYY-MM-DD HH:mm:ss')}>
                          <HStack>
                            <Heading fontSize="sm">
                              {dayjs.duration(Math.floor(nextEraTimeLeft / 1000), 'seconds').humanize(true)}
                            </Heading>
                            <CircularProgress value={(EPOCH_DURATION_MS - nextEraTimeLeft) / (EPOCH_DURATION_MS/100)} size={4} thickness={18} />
                          </HStack>
                        </Tooltip> :
                        <Spinner size="sm" />
                    }
                  </VStack>

                </Flex>

                <Flex mt={3} justifyContent="space-between">
                  <VStack alignItems="flex-start" spacing={1}>
                    <Text fontSize="xs" color="gray">Block Height</Text>
                    {
                      bestBlock > 0 ?
                        <Heading fontSize="sm">
                          {DecimalUtils.beautify(new Decimal(bestBlock), 0)}
                        </Heading> : <Spinner size="sm" />
                    }
                  </VStack>
                </Flex>

              </GridItem>
              <GridItem colSpan={1}>
                <Center h="100%">
                  <Divider orientation="vertical" />
                </Center>
              </GridItem>
              <GridItem colSpan={4}>
                <Skeleton isLoaded={!!appchainInfo}>
                  <VStack alignItems="flex-start" spacing={1}>
                    <Text fontSize="xs" color="gray">Token</Text>
                    <HStack w="100%">
                      <Heading fontSize="sm" whiteSpace="nowrap"
                        overflow="hidden" textOverflow="ellipsis">
                        {appchainInfo?.appchainMetadata.fungibleTokenMetadata.name || 'loading'}
                        ({appchainInfo?.appchainMetadata.fungibleTokenMetadata.symbol})
                      </Heading>
                    </HStack>
                  </VStack>
                </Skeleton>

                <VStack alignItems="flex-start" spacing={1} mt={3}>
                  <Text fontSize="xs" color="gray">Total Issuance</Text>
                  <HStack w="100%">
                    {
                      totalIssuance.gt(ZERO_DECIMAL) ?
                        <Heading fontSize="sm" whiteSpace="nowrap"
                          overflow="hidden" textOverflow="ellipsis">
                          {DecimalUtils.beautify(totalIssuance)}
                        </Heading> :
                        <Spinner size="sm" />
                    }
                  </HStack>
                </VStack>

              </GridItem>
              <GridItem colSpan={1}>
                <Center h="100%">
                  <Divider orientation="vertical" />
                </Center>
              </GridItem>
              <GridItem colSpan={5}>
                <Skeleton isLoaded={!!appchainInfo}>
                  <VStack alignItems="flex-start" spacing={1}>
                    <HStack color="gray">
                      <Text fontSize="xs">IDO Amount</Text>
                      <QuestionOutlineIcon boxSize={3} />
                    </HStack>
                    <HStack w="100%">
                      <Heading fontSize="sm" whiteSpace="nowrap"
                        overflow="hidden" textOverflow="ellipsis">
                        {
                          appchainInfo ?
                            DecimalUtils.beautify(
                              appchainInfo.appchainMetadata.idoAmountOfWrappedAppchainToken
                            ) :
                            'loading'
                        }
                      </Heading>
                    </HStack>
                  </VStack>
                </Skeleton>

                <Skeleton isLoaded={!!appchainInfo}>
                  <VStack alignItems="flex-start" spacing={1} mt={3}>
                    <HStack color="gray">
                      <Text fontSize="xs">Premined Amount</Text>
                      <QuestionOutlineIcon boxSize={3} />
                    </HStack>
                    <HStack w="100%">
                      <Heading fontSize="sm" whiteSpace="nowrap"
                        overflow="hidden" textOverflow="ellipsis">
                        {
                          appchainInfo ?
                            DecimalUtils.beautify(
                              appchainInfo.appchainMetadata.preminedWrappedAppchainToken
                            ) :
                            'loading'
                        }
                      </Heading>
                    </HStack>
                  </VStack>
                </Skeleton>

                <Skeleton isLoaded={!!appchainSettings}>
                  <VStack alignItems="flex-start" spacing={1} mt={3}>
                    <HStack color="gray">
                      <Text fontSize="xs">Era Reward</Text>
                      <QuestionOutlineIcon boxSize={3} />
                    </HStack>
                    <HStack w="100%">
                      <Heading fontSize="sm" whiteSpace="nowrap"
                        overflow="hidden" textOverflow="ellipsis">
                        {
                          appchainSettings ?
                            DecimalUtils.beautify(
                              appchainSettings.eraReward
                            ) :
                            'loading'
                        }
                      </Heading>
                    </HStack>
                  </VStack>
                </Skeleton>
              </GridItem>
            </SimpleGrid>
          </GridItem>
        </SimpleGrid>

        <SimpleGrid columns={9} mt={6} gap={6}>
          <GridItem colSpan={5}>
            <Box p={6} bg="white" boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px" borderRadius="xl">
              <NodePanel appchain={appchainInfo} apiPromise={apiPromise} />
            </Box>
          </GridItem>
          <GridItem colSpan={4}>
            <Box p={6} bg="white" boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px" borderRadius="xl">
              <StakingPanel anchorContract={anchorContract} appchain={appchainInfo} currentEra={currentEra} 
                nextEraTimeLeft={nextEraTimeLeft} />
            </Box>
          </GridItem>
        </SimpleGrid>

        <Box mt={6} p={6} bg="white" boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px" borderRadius="xl">
          <Tabs>
            <TabList>
              {/* <Tab>Blocks</Tab> */}
              <Tab>Validators</Tab>
            </TabList>
            <TabPanels>
              {/* <TabPanel pl={0} pr={0}>
                <BlocksTable apiPromise={apiPromise} bestNumber={bestBlock} />
              </TabPanel> */}
              <TabPanel pl={0} pr={0}>
                <ValidatorsTable anchorContract={anchorContract} appchainId={id} size="md"
                  currentEra={currentEra} appchain={appchainInfo} apiPromise={apiPromise} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

    </>
  );
}
