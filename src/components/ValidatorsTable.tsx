import React, { useEffect, useState, useMemo } from 'react';
import { ApiPromise } from '@polkadot/api';
import IdentityIcon from '@polkadot/react-identicon';

import {
  Table,
  Thead,
  Tbody,
  FormControl,
  FormLabel,
  Switch,
  Tr,
  Th,
  Td,
  Skeleton,
  Box,
  Flex,
  Text,
  Link,
  VStack,
  Button,
  useBoolean,
  MenuGroup,
  Menu,
  MenuItem,
  Popover,
  Heading,
  PopoverContent,
  Portal,
  PopoverBody,
  PopoverFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogOverlay,
  AlertDialogFooter,
  MenuList,
  Tooltip,
  MenuButton,
  MenuDivider,
  Input,
  Icon,
  HStack,
  useToast,
  Spinner,
  Badge
} from '@chakra-ui/react';

import {
  AnchorContract,
  AppchainId,
  AppchainValidator,
  RewardHistory,
  AppchainInfo,
  TokenContract
} from 'types';

import { Link as RouterLink } from 'react-router-dom';
import { InfoOutlineIcon, ChevronDownIcon, MinusIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';
import { RegisterDelegatorModal } from 'components';
import { FAILED_TO_REDIRECT_MESSAGE, Gas, OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { DecimalUtils, ZERO_DECIMAL, toShortAddress } from 'utils';
import { encodeAddress } from '@polkadot/util-crypto';
import { useGlobalStore } from 'stores';
import { BiCoinStack } from 'react-icons/bi';
import BN from 'bn.js';

const NoValidators = () => (
  <Box p={3} borderRadius={10} w="100%">
    <Flex color="gray" flexDirection="column" justifyContent="center" alignItems="center">
      <InfoOutlineIcon w={5} h={5} color="gray.400" />
      <Text mt={2} fontSize="xs">No Validators</Text>
    </Flex>
  </Box>
);

type ValidatorRowProps = {
  apiPromise: ApiPromise;
  validator: AppchainValidator;
  currentEra: number;
  appchainId: string;
  appchain: AppchainInfo;
  noAction: boolean;
  anchorContract: AnchorContract;
  onRegisterDelegator: Function;
  isInAppchain: boolean;
  base58Address: string;
  onClaimDelegatorRewards: Function;
}

const ValidatorRow: React.FC<ValidatorRowProps> = ({
  validator,
  appchainId,
  appchain,
  noAction,
  anchorContract,
  onRegisterDelegator,
  currentEra,
  isInAppchain,
  base58Address,
  onClaimDelegatorRewards
}) => {
  const [delegatedDeposits, setDelegatedDeposits] = useState(ZERO_DECIMAL);

  const [delegateAmount, setDelegateAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [delegateMorePopoverOpen, setDelegateMorePopoverOpen] = useBoolean(false);
  const [decreaseDelegationPopoverOpen, setDecreaseDelegationPopoverOpen] = useBoolean(false);
  const [unbondDelegationPopoverOpen, setUnbondDelegationPopoverOpen] = useBoolean(false);
  const [isDelegating, setIsDelegating] = useState(false);
  const [isUnbonding, setIsUnbonding] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useBoolean(true);

  const toast = useToast();
  const globalStore = useGlobalStore(state => state.globalStore);

  const actionsRef = React.useRef();
  const delegateAmountInputRef = React.useRef<any>();
  const decreaseAmountInputRef = React.useRef<any>();
  const [rewards, setRewards] = useState<RewardHistory[]>();
  const [delegatorRewards, setDelegatorRewards] = useState<RewardHistory[]>();

  useEffect(() => {
    if (delegateMorePopoverOpen) {
      setTimeout(() => {
        if (delegateAmountInputRef.current) {
          delegateAmountInputRef.current.focus();
        }
      }, 200);
    } else if (decreaseDelegationPopoverOpen) {
      setTimeout(() => {
        if (decreaseAmountInputRef.current) {
          decreaseAmountInputRef.current.focus();
        }
      }, 200);
    }
  }, [delegateMorePopoverOpen, decreaseDelegationPopoverOpen]);

  useEffect(() => {

    if (!anchorContract || !globalStore.accountId) {
      return;
    }

    anchorContract.get_delegator_deposit_of({
      delegator_id: globalStore.accountId,
      validator_id: validator.validatorId
    }).then(amount => {
      setDelegatedDeposits(
        DecimalUtils.fromString(amount, OCT_TOKEN_DECIMALS)
      );
    });

  }, [anchorContract, globalStore, validator]);

  useEffect(() => {

    if (!anchorContract || !appchain || currentEra === undefined) {
      return;
    }

    setIsLoadingRewards.on();
    anchorContract
      .get_validator_rewards_of({
        start_era: '0',
        end_era: currentEra?.toString() || '0',
        validator_id: validator.validatorId
      }).then(rewards => {
        setRewards(
          rewards.map(({ total_reward, unwithdrawn_reward, era_number }) => ({
            total_reward: DecimalUtils.fromString(total_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
            unwithdrawn_reward: DecimalUtils.fromString(unwithdrawn_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
            eraNumber: (era_number as any) * 1
          }))
        );
        setIsLoadingRewards.off();
      });
    
    if (globalStore.accountId) {
      anchorContract
        .get_delegator_rewards_of({
          start_era: '0',
          end_era: currentEra?.toString() || '0',
          delegator_id: globalStore.accountId,
          validator_id: validator.validatorId
        }).then(rewards => {
          setDelegatorRewards(
            rewards.map(({ total_reward, unwithdrawn_reward, era_number }) => ({
              total_reward: DecimalUtils.fromString(total_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
              unwithdrawn_reward: DecimalUtils.fromString(unwithdrawn_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
              eraNumber: (era_number as any) * 1
            }))
          );
        });
    }
    
  }, [anchorContract, currentEra, globalStore, appchain, validator]);

  const unwithdraedAmount = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.reduce((total, next) => total.plus(next.unwithdrawn_reward), ZERO_DECIMAL);

  }, [rewards]);

  const unwithdrawedDelegatorRewards = useMemo(() => {
    return !delegatorRewards?.length ? ZERO_DECIMAL :
    delegatorRewards.reduce((total, next) => total.plus(next.unwithdrawn_reward), ZERO_DECIMAL);
  }, [delegatorRewards]);

  const totalRewards = useMemo(() => rewards ?
    rewards.reduce((total, next) => total.plus(next.total_reward), ZERO_DECIMAL) : ZERO_DECIMAL,
    [rewards]
  );

  const onIncreaseDelegation = (id) => {
    setIsDelegating(true);
    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchorContract.contractId,
          amount: DecimalUtils.toU64(delegateAmount, OCT_TOKEN_DECIMALS).toString(),
          msg: JSON.stringify({
            IncreaseDelegation: {
              validator_id: id
            }
          })
        },
        Gas.COMPLEX_CALL_GAS,
        1,
      ).catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsDelegating(false);
      });
  }

  const onDecreaseDelegation = (id) => {
    setIsDelegating(true);
    anchorContract
      .decrease_delegation(
        {
          validator_id: id,
          amount: DecimalUtils.toU64(delegateAmount, OCT_TOKEN_DECIMALS).toString()
        },
        Gas.COMPLEX_CALL_GAS
      ).catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsDelegating(false);
      });
  }

  const onUnbondDelegation = (id) => {
    setIsUnbonding(true);
    anchorContract
      .unbond_delegation(
        {
          validator_id: id
        },
        Gas.COMPLEX_CALL_GAS
      )
      .catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsUnbonding(false);
      });
  }

  const onDelegateAmountChange = ({ target: { value } }) => {
    setDelegateAmount(DecimalUtils.fromString(value));
  }

  const toggleDelegation = () => {
    const method = validator.canBeDelegatedTo ? anchorContract.disable_delegation :
      anchorContract.enable_delegation;
    
    method({}, Gas.COMPLEX_CALL_GAS).catch(err => {
      if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
        return;
      }
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
      
    });
  }

  const isYou = useMemo(() => globalStore && validator &&
    (globalStore?.accountId === validator?.validatorId), [globalStore, validator]);

  return (
    <>
      <Tr>
        <Td>
          <VStack alignItems="flex-start" spacing={1}>
            <HStack>
              <Box borderRadius="full" overflow="hidden" borderWidth={1} w="22px" h="22px">
                <IdentityIcon size={20} value={base58Address} />
              </Box>
              <Link as={RouterLink} to={`/profile/${validator.validatorId}@${appchainId}`}
                _hover={{ textDecoration: 'underline' }} title={isYou ? 'Is you:)' : ''}>
                <Text>{toShortAddress(validator.validatorId)}</Text>
              </Link>
              {
                isInAppchain ?
                  <Box transform="scale(.8)" transformOrigin="left">
                    <Tooltip label="Great! You are in the appchain validator list, it means you can get your rewards normaly">
                      <Badge colorScheme="blue" variant="outline" borderRadius="xl">Validating</Badge>
                    </Tooltip>
                  </Box> :
                  <Box transform="scale(.8)" transformOrigin="left">
                    <Tooltip label="You are not in appchain validator list yet, you may have to wait until the next era.">
                      <Badge colorScheme="yellow" variant="outline" borderRadius="xl">Staker</Badge>
                    </Tooltip>
                  </Box>
              }
            </HStack>
            <Skeleton isLoaded={!isLoadingRewards}>
              <Text fontSize="xs" color="gray">
                Rewards: {DecimalUtils.beautify(totalRewards)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
                {
                  unwithdraedAmount.gt(ZERO_DECIMAL) ?
                    `, unclaimed: ${DecimalUtils.beautify(unwithdraedAmount)} ${appchain?.appchainMetadata.fungibleTokenMetadata.symbol}` : ''
                }
              </Text>
            </Skeleton>
          </VStack>
        </Td>

        <Td textAlign="center">{DecimalUtils.beautify(validator.totalStake)} OCT</Td>
        <Td textAlign="center">{DecimalUtils.beautify(validator.depositAmount)} OCT</Td>
        <Td textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>
          {validator.delegatorsCount}
        </Td>
        {
          noAction !== true ?
            <Td>
              {
                delegatedDeposits === undefined ?
                  <Spinner size="sm" /> :
                  delegatedDeposits.gt(ZERO_DECIMAL) ?
                    
                    <Menu>
                      <MenuButton as={Button} size="sm" variant="outline" colorScheme="octoColor" rightIcon={<ChevronDownIcon />} ref={actionsRef}>
                        Actions
                      </MenuButton>
                      <MenuList>
                        <MenuGroup title={`Delegated: ${DecimalUtils.beautify(delegatedDeposits)} OCT`}>
                          <MenuItem onClick={setDelegateMorePopoverOpen.on}>
                            <HStack fontSize="sm"><AddIcon boxSize={3} /> <Text>Increase Delegation</Text></HStack>
                          </MenuItem>
                          <MenuItem onClick={setDecreaseDelegationPopoverOpen.on}>
                            <HStack fontSize="sm"><MinusIcon boxSize={3} /> <Text>Decrease Delegation</Text></HStack>
                          </MenuItem>
                          
                        </MenuGroup>
                        <MenuDivider />
                        {
                          unwithdrawedDelegatorRewards.gt(ZERO_DECIMAL) ?
                          <MenuItem onClick={() => onClaimDelegatorRewards(validator.validatorId)}>
                            <HStack fontSize="sm" color="blue"><Icon as={BiCoinStack} boxSize={3} />
                            <Text>Claim {DecimalUtils.beautify(unwithdrawedDelegatorRewards)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}</Text>
                          </HStack>
                          </MenuItem> : 
                          <MenuItem onClick={setUnbondDelegationPopoverOpen.on}>
                            <HStack fontSize="sm" color="red"><CloseIcon boxSize={3} /> <Text>Unbond Delegation</Text></HStack>
                          </MenuItem>
                        }
                      </MenuList>
                    </Menu> :
                    (
                      globalStore.accountId === validator.validatorId ?
                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="can-be-delegate" mb={0} fontSize="xs">
                          Delegation
                        </FormLabel>
                        <Switch id="can-be-delegate" isChecked={validator.canBeDelegatedTo} onChange={toggleDelegation} />
                      </FormControl> :
                      <Button size="xs" colorScheme="octoColor" variant="outline" onClick={() => onRegisterDelegator(validator.validatorId)}
                        isDisabled={!validator.canBeDelegatedTo}>Delegate</Button>
                    )
              }
            </Td> : false
        }
      </Tr>
      <Popover
        isOpen={delegateMorePopoverOpen}
        onClose={setDelegateMorePopoverOpen.off}
      >
        <Portal containerRef={actionsRef}>
          <PopoverContent>
            <PopoverBody>
              <Flex p={2}>
                <Input placeholder="amount of OCT" ref={delegateAmountInputRef}
                  onChange={onDelegateAmountChange} />
              </Flex>
            </PopoverBody>
            <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
              <Text color="gray" fontSize="xs">Delegated: {DecimalUtils.beautify(delegatedDeposits)} OCT</Text>
              <Button size="sm" onClick={() => onIncreaseDelegation(validator.validatorId)} colorScheme="octoColor"
                isLoading={isDelegating} isDisabled={isDelegating}>Increase</Button>
            </PopoverFooter>
          </PopoverContent>
        </Portal>
      </Popover>

      <Popover
        isOpen={decreaseDelegationPopoverOpen}
        onClose={setDecreaseDelegationPopoverOpen.off}
      >
        <Portal containerRef={actionsRef}>
          <PopoverContent>
            <PopoverBody>
              <Box p={2}>
                <Flex whiteSpace="break-spaces" textAlign="left">
                  <Text fontSize="sm" color="gray">Your decreased stakes will be claimable after 28 days.</Text>
                </Flex>
                <Flex mt={2}>
                  <Input placeholder="amount of OCT" ref={decreaseAmountInputRef} mt={2} onChange={onDelegateAmountChange} />
                </Flex>
              </Box>
            </PopoverBody>
            <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
              <Text color="gray" fontSize="xs">Delegated: {DecimalUtils.beautify(delegatedDeposits)} OCT</Text>
              <Button size="sm" onClick={() => onDecreaseDelegation(validator.validatorId)} colorScheme="octoColor"
                isLoading={isDelegating} isDisabled={isDelegating}>Decrease</Button>
            </PopoverFooter>
          </PopoverContent>
        </Portal>
      </Popover>

      <Popover
        isOpen={unbondDelegationPopoverOpen}
        onClose={setUnbondDelegationPopoverOpen.off}
      >
        <Portal containerRef={actionsRef}>
          <PopoverContent>
            <PopoverBody>
              <Flex p={2} alignItems="flex-start" flexDirection="column" whiteSpace="break-spaces" textAlign="left">
                <Heading fontSize="md" color="black">Are you sure to unbond?</Heading>
                <Text color="gray" fontSize="sm" mt={2}>Your unbonded stakes will be claimable after 28 days.</Text>
              </Flex>
              <Flex p={2}>
                <HStack>
                  <Button size="sm" colorScheme="red" onClick={() => onUnbondDelegation(validator.validatorId)} 
                    isDisabled={isUnbonding} isLoading={isUnbonding}>Confirm</Button>
                  <Button size="sm" onClick={setUnbondDelegationPopoverOpen.off}>Cancel</Button>
                </HStack>
              </Flex>
            </PopoverBody>
            
          </PopoverContent>
        </Portal>
      </Popover>

    </>
  );
}

type ValidatorsTableProps = {
  apiPromise?: ApiPromise;
  appchain?: AppchainInfo;
  anchorContract: AnchorContract;
  currentEra?: number;
  noAction?: boolean;
  appchainId: AppchainId;
  size?: 'sm' | 'md' | 'lg'
}

export const ValidatorsTable: React.FC<ValidatorsTableProps> = ({
  apiPromise,
  anchorContract,
  currentEra,
  noAction,
  appchainId,
  appchain,
  size = 'sm'
}) => {

  const [validatorList, setValidatorList] = useState<AppchainValidator[]>();
  const [selectedValidatorAccountId, setSelectedValidatorAccountId] = useState('');
  const [registerDelegatorModalOpen, setRegisterDelegatorModalOpen] = useBoolean(false);
  const [appchainValidators, setAppchainValidators] = useState<string[]>();
  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState(ZERO_DECIMAL);
  const globalStore = useGlobalStore(state => state.globalStore);
  const [wrappedAppchainTokenContractId, setWrappedAppchainTokenContractId] = useState('');
  const [depositAlertOpen, setDepositAlertOpen] = useBoolean(false);
  const cancelRef = React.useRef();
  const toast = useToast();

  useEffect(() => {

    if (!anchorContract) {
      return;
    }
    Promise.all([
      anchorContract.get_validator_list_of(),
      anchorContract.get_wrapped_appchain_token()
    ]).then(([res, wrappedToken]) => {
      const wrappedTokencontract = new TokenContract(
        globalStore.walletConnection.account(),
        wrappedToken.contract_account,
        {
          viewMethods: ['storage_balance_of', 'ft_balance_of'],
          changeMethods: []
        }
      );

      setWrappedAppchainTokenContractId(wrappedToken.contract_account);
      
      if (globalStore.accountId) {
        wrappedTokencontract
          .storage_balance_of({ account_id: globalStore.accountId })
          .then(storage => {
            setWrappedAppchainTokenStorageBalance(
              storage?.total ? DecimalUtils.fromString(storage.total, 24) : ZERO_DECIMAL
            );
          });
      }

      setValidatorList(
        res.map(v => ({
          validatorId: v.validator_id,
          validatorIdInAppchain: v.validator_id_in_appchain,
          depositAmount: DecimalUtils.fromString(v.deposit_amount, OCT_TOKEN_DECIMALS),
          totalStake: DecimalUtils.fromString(v.total_stake, OCT_TOKEN_DECIMALS),
          delegatorsCount: v.delegators_count as any * 1,
          canBeDelegatedTo: v.can_be_delegated_to
        })).sort((a, b) => a.totalStake.sub(b.totalStake).toNumber())
      );
    });

  }, [anchorContract, globalStore]);

  useEffect(() => {

    if (apiPromise) {
      setTimeout(() => {
        apiPromise?.query?.session?.validators()
          .then(vs => {
            console.log(vs.map(v => v.toString()));
            setAppchainValidators(vs.map(v => v.toString()));
          });
      }, 500);
    }
  }, [apiPromise]);

  const onRegisterDelegator = (id: string) => {
    setSelectedValidatorAccountId(id);
    setRegisterDelegatorModalOpen.on();
  }

  const onClaimDelegatorRewards = async (validatorId) => {

    try {

      if (wrappedAppchainTokenStorageBalance.lte(ZERO_DECIMAL)) {
        setDepositAlertOpen.on();
        return;
      }

      await anchorContract
        .withdraw_delegator_rewards(
          {
            delegator_id: globalStore.accountId,
            validator_id: validatorId
          },
          Gas.COMPLEX_CALL_GAS
        );
    } catch (err) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }

  }

  const onDepositStorage = () => {
    globalStore.walletConnection.account().functionCall({
      contractId: wrappedAppchainTokenContractId,
      methodName: 'storage_deposit',
      args: { account_id: globalStore.accountId },
      gas: new BN(Gas.SIMPLE_CALL_GAS),
      attachedDeposit: new BN('1250000000000000000000')
    });
  }

  return (
    <>
      <Skeleton isLoaded={validatorList !== undefined}>
        {
          validatorList?.length > 0 ?
            <Table variant="simple" size={size}>
              <Thead>
                <Tr>
                  <Th>Validator Id</Th>
                  <Th textAlign="center">Total Stake</Th>
                  <Th textAlign="center">Own Stake</Th>
                  <Th textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>Delegators</Th>
                  {
                    noAction !== true ?
                      <Th></Th> : null
                  }
                </Tr>
              </Thead>
              <Tbody>
                {
                  validatorList.map((v, idx) => {
                    let base58Address;
                    try {
                      base58Address = encodeAddress(v.validatorIdInAppchain);
                    } catch(err) {
                      return null;
                    }

                    return (
                      <ValidatorRow
                        key={`validator-${idx}`}
                        validator={v}
                        appchainId={appchainId}
                        currentEra={currentEra}
                        appchain={appchain}
                        anchorContract={anchorContract}
                        noAction={noAction}
                        base58Address={base58Address}
                        isInAppchain={appchainValidators?.some(s => s === base58Address)}
                        apiPromise={apiPromise}
                        onClaimDelegatorRewards={onClaimDelegatorRewards}
                        onRegisterDelegator={onRegisterDelegator} />
                    );
                  })
                }
              </Tbody>
            </Table> :
            <NoValidators />
        }
      </Skeleton>
      <RegisterDelegatorModal
        isOpen={registerDelegatorModalOpen}
        anchorContract={anchorContract}
        validatorAccountId={selectedValidatorAccountId}
        onClose={setRegisterDelegatorModalOpen.off} />

      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={setDepositAlertOpen.off}
        isOpen={depositAlertOpen}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Setup Account</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            It seems that you haven't setup your account on wrapped {appchain?.appchainMetadata.fungibleTokenMetadata.symbol} token yet
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={setDepositAlertOpen.off}>
              Maybe Later
            </Button>
            <Button colorScheme="octoColor" ml={3} onClick={onDepositStorage}>
              Setup Right Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
