import React, { useState, useEffect, useMemo } from 'react';

import {
  Input,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Divider,
  useBoolean,
  Flex,
  Skeleton,
  Box,
  useToast,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogOverlay,
  AlertDialogFooter,
  Popover,
  Icon,
  Progress,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter
} from '@chakra-ui/react';

import { MinusIcon, InfoIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';
import BN from 'bn.js';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { useGlobalStore } from 'stores';
import { ZERO_DECIMAL, DecimalUtils } from 'utils';
import { RegisterValidatorModal } from 'components';

import { 
  OCT_TOKEN_DECIMALS, 
  Gas, 
  FAILED_TO_REDIRECT_MESSAGE, 
  EPOCH_DURATION_MS 
} from 'primitives';

import {
  AnchorContract,
  AppchainInfo,
  RewardHistory,
  UnbondedHistory,
  TokenContract,
  AccountId,
  OriginStakingHistory
} from 'types';

type StakingPanelProps = {
  appchain: AppchainInfo;
  currentEra: number;
  anchorContract: AnchorContract;
  nextEraTimeLeft: number;
}

export const StakingPanel: React.FC<StakingPanelProps> = ({ anchorContract, appchain, currentEra, nextEraTimeLeft }) => {
  const [isInValidatorList, setIsInValidatorList] = useState(false);
  const globalStore = useGlobalStore(state => state.globalStore);

  const [isClaiming, setIsClaiming] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [decreaseStakePopoverOpen, setDecreaseStakePopoverOpen] = useBoolean(false);
  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);
  const [wrappedAppchainTokenContractId, setWrappedAppchainTokenContractId] = useState<AccountId>();
  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState(ZERO_DECIMAL);
  const [rewards, setRewards] = useState<RewardHistory[]>();

  const [unbondedStakes, setUnbondedStakes] = useState<UnbondedHistory[]>();
  const [depositAmount, setDepositAmount] = useState(ZERO_DECIMAL);
  const [inputAmount, setInputAmount] = useState(ZERO_DECIMAL);
  const [decreaseAmount, setDecreaseAmount] = useState(ZERO_DECIMAL);

  const [userUpvoteDeposit, setUserUpvoteDeposit] = useState(ZERO_DECIMAL);
  const [userDownvoteDeposit, setUserDownvoteDeposit] = useState(ZERO_DECIMAL);
  const [withdrawVotesPopoverOpen, setWithdrawVotesPopoverOpen] = useBoolean(false);
  const [withdrawStakesPopoverOpen, setWithdrawStakesPopoverOpen] = useBoolean(false);
  const [withdrawingUpvotes, setWithdrawingUpvotes] = useState(false);
  const [withdrawingDownvotes, setWithdrawingDownvotes] = useState(false);
  const [stakingHistories, setStakingHistories] = useState<OriginStakingHistory[]>();

  const [registerModalOpen, setRegisterModalOpen] = useBoolean(false);
  const [depositAlertOpen, setDepositAlertOpen] = useBoolean(false);

  const toast = useToast();

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const decreaseStakeAmountInputRef = React.useRef();
  const cancelRef = React.useRef();
  const [isStaking, setIsStaking] = useState(false);
  const [isUnbonding, setIsUnbonding] = useState(false);

  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);

  useEffect(() => {
    if (!anchorContract || !globalStore.accountId) {
      if (!globalStore.accountId) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    Promise.all([
      globalStore
        .registryContract
        .get_upvote_deposit_for({
          appchain_id: appchain?.appchainId,
          account_id: globalStore.accountId
        }),

      globalStore
        .registryContract
        .get_downvote_deposit_for({
          appchain_id: appchain?.appchainId,
          account_id: globalStore.accountId
        })
    ]).then(([upvoteDeposit, downvoteDeposit]) => {
      setUserUpvoteDeposit(
        DecimalUtils.fromString(upvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      setUserDownvoteDeposit(
        DecimalUtils.fromString(downvoteDeposit, OCT_TOKEN_DECIMALS)
      );
    });

    setIsLoading(true);
    Promise.all([
      anchorContract
        .get_validator_deposit_of({
          validator_id: globalStore.accountId
        }),

      anchorContract.get_wrapped_appchain_token(),
      
      anchorContract.get_unbonded_stakes_of({ account_id: globalStore.accountId }),

      anchorContract.get_validator_list_of(),
      // anchorContract.get_user_staking_histories_of({ account_id: globalStore.accountId })
    ]).then(([deposit, wrappedToken, unbondStakes, validatorList]) => {

      // setStakingHistories(histories);

      setUnbondedStakes(unbondStakes.map(s => ({
        amount: DecimalUtils.fromString(s.amount, OCT_TOKEN_DECIMALS),
        eraNumber: (s.era_number as any) * 1,
        unlockTime: Math.floor((s.unlock_time as any) / 1000000)
      })));

      setIsLoading(false);
      setDepositAmount(
        DecimalUtils.fromString(
          deposit,
          OCT_TOKEN_DECIMALS
        )
      );

      setWrappedAppchainTokenContractId(wrappedToken.contract_account);

      setIsInValidatorList(
        (validatorList as any).some(v => v.validator_id === globalStore.accountId)
      );

      const wrappedTokencontract = new TokenContract(
        globalStore.walletConnection.account(),
        wrappedToken.contract_account,
        {
          viewMethods: ['storage_balance_of', 'ft_balance_of'],
          changeMethods: []
        }
      );

      Promise.all([
        wrappedTokencontract.storage_balance_of({ account_id: globalStore.accountId }),
        // wrappedTokencontract.ft_balance_of({ account_id: globalStore.accountId })
      ]).then(([storage, balance]) => {

        setWrappedAppchainTokenStorageBalance(
          storage?.total ? DecimalUtils.fromString(storage.total, 24) : ZERO_DECIMAL
        );

      });
    });
  }, [anchorContract, globalStore]);

  useEffect(() => {
    if (!globalStore.accountId || !anchorContract || !currentEra || !appchain) {
      return;
    }
    anchorContract
      .get_validator_rewards_of({
        start_era: '0',
        end_era: currentEra.toString(),
        validator_id: globalStore.accountId
      }).then(rewards => {

        setRewards(rewards.map(({ total_reward, unwithdrawn_reward, era_number }) => ({
          total_reward: DecimalUtils.fromString(total_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
          unwithdrawn_reward: DecimalUtils.fromString(unwithdrawn_reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
          eraNumber: (era_number as any) * 1
        })));
      });

  }, [currentEra, globalStore, anchorContract, appchain]);

  const unwithdrawedAmount = useMemo(() => {
    return !rewards?.length ? ZERO_DECIMAL :
      rewards.reduce((total, next) => total.plus(next.unwithdrawn_reward), ZERO_DECIMAL);
  }, [rewards]);

  const totalUnbondedStakes = useMemo(() => {
    return !unbondedStakes?.length ? ZERO_DECIMAL :
      unbondedStakes.reduce((total, next) => total.plus(next.amount), ZERO_DECIMAL);
  }, [unbondedStakes])

  const claimableUnbondedStakes = useMemo(() => {
    return !unbondedStakes?.length ? ZERO_DECIMAL :
      unbondedStakes.reduce((total, next) => next.unlockTime < new Date().getTime() ? total.plus(next.amount) : total, ZERO_DECIMAL);
  }, [unbondedStakes]);

  const noEffectHistories = useMemo(() => stakingHistories?.filter(h => !h.has_taken_effect && (
    h.staking_fact.DelegationDecreased || 
    h.staking_fact.StakeDecreased
  )), [stakingHistories]);

  const onAmountChange = ({ target: { value } }) => {
    setInputAmount(DecimalUtils.fromString(value));
  }

  const onDecreaseAmountChange = ({ target: { value } }) => {
    setDecreaseAmount(DecimalUtils.fromString(value));
  }

  const onClaimRewards = async () => {
    setIsClaiming(true);

    try {

      if (wrappedAppchainTokenStorageBalance.lte(ZERO_DECIMAL)) {
        setDepositAlertOpen.on();
        return;
      }

      await anchorContract
        .withdraw_validator_rewards(
          {
            validator_id: globalStore.accountId
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

    setIsClaiming(false);
  }

  const onIncreaseStake = () => {
    setIsStaking(true);
    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchorContract.contractId,
          amount: DecimalUtils.toU64(inputAmount, OCT_TOKEN_DECIMALS).toString(),
          msg: '"IncreaseStake"'
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
        setIsStaking(false);
        console.log(err);
      });
  }

  const onDecreaseStake = () => {
    setIsStaking(true);
    anchorContract
      .decrease_stake(
        {
          amount: DecimalUtils.toU64(decreaseAmount, OCT_TOKEN_DECIMALS).toString()
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
        setIsStaking(false);
        console.log(err);
      });
  }

  const onUnbond = () => {
    setIsUnbonding(true);
    anchorContract
      .unbond_stake(
        {},
        Gas.COMPLEX_CALL_GAS
      )
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsUnbonding(false);
      });
  }

  const onDepositAlertClose = () => {
    setDepositAlertOpen.off();
    setIsClaiming(false);
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

  const withdrawVotes = (type: string, amount: Decimal) => {
    const method =
      type === 'upvote' ?
        globalStore.registryContract.withdraw_upvote_deposit_of :
        globalStore.registryContract.withdraw_downvote_deposit_of;

    return method(
      {
        appchain_id: appchain?.appchainId,
        amount: DecimalUtils.toU64(amount, OCT_TOKEN_DECIMALS).toString()
      },
      Gas.COMPLEX_CALL_GAS
    ).then(() => {
      window.location.reload();
    });
  }

  const onWithdrawUpvotes = async () => {
    setWithdrawingUpvotes(true);

    try {
      await withdrawVotes('upvote', userUpvoteDeposit);
    } catch (err) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }

    setWithdrawingUpvotes(false);
  }

  const onWithdrawDownvotes = async () => {
    setWithdrawingDownvotes(true);

    try {
      await withdrawVotes('downvote', userDownvoteDeposit);
    } catch (err) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }

    setWithdrawingDownvotes(false);
  }

  const onWithdrawStakes = async () => {
    setIsWithdrawing(true);
    anchorContract
      .withdraw_stake(
        {
          account_id: globalStore.accountId
        },
        Gas.COMPLEX_CALL_GAS
      )
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsUnbonding(false);
      });
  }

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <HStack>
          <Icon as={RiMoneyDollarCircleLine} boxSize={6} />
          <Heading fontSize="lg">My Staking</Heading>
        </HStack>
        {
          userUpvoteDeposit.gt(ZERO_DECIMAL) || userDownvoteDeposit.gt(ZERO_DECIMAL) ?
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={withdrawVotesPopoverOpen}
              onClose={setWithdrawVotesPopoverOpen.off}
            >
              <PopoverTrigger>
                <Button onClick={setWithdrawVotesPopoverOpen.on} size="sm" variant="ghost" colorScheme="octoColor"
                  isDisabled={withdrawVotesPopoverOpen}>
                  Withdraw Votes
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <Box p={2}>
                    {
                      userUpvoteDeposit.gt(ZERO_DECIMAL) ?
                        <Flex>
                          <Text>
                            Your Upvotes: {DecimalUtils.beautify(userUpvoteDeposit)} OCT
                          </Text>
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                        </Flex> : null
                    }
                    {
                      userDownvoteDeposit.gt(ZERO_DECIMAL) ?
                        <Flex mt={3}>
                          <Text>
                            Your Downvotes: {DecimalUtils.beautify(userDownvoteDeposit)} OCT
                          </Text>
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingDownvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawDownvotes}>Withdraw</Button>
                        </Flex> : null
                    }

                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover> :
            <HStack>
              {
                unwithdrawedAmount.gt(ZERO_DECIMAL) ?
                <Button colorScheme="octoColor" size="sm" variant="ghost" onClick={onClaimRewards} isLoading={isClaiming} isDisabled={isClaiming}>
                  Claim {DecimalUtils.beautify(unwithdrawedAmount)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
                </Button> : null
              }
              {
                unbondedStakes?.length > 0 ?
                <Popover
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    isOpen={withdrawStakesPopoverOpen}
                    onClose={setWithdrawStakesPopoverOpen.off}
                  >
                    <PopoverTrigger>
                      <Button colorScheme="octoColor" size="sm"
                        onClick={setWithdrawStakesPopoverOpen.toggle}
                        isDisabled={withdrawStakesPopoverOpen}>Withdraw Stakes</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverBody>
                        <Box p={2}>
                          <Flex alignItems="center">
                            <Text>Total unbonded:</Text>
                            <Heading fontSize="md" ml={1}>{DecimalUtils.beautify(totalUnbondedStakes)} OCT</Heading>
                          </Flex>
                          <Flex alignItems="center" mt={1}>
                            <Text>Claimable:</Text>
                            <Heading fontSize="md" ml={1}>{DecimalUtils.beautify(claimableUnbondedStakes)} OCT</Heading>
                            {
                              <Button colorScheme="octoColor" size="xs" variant="outline" ml={2} 
                                onClick={onWithdrawStakes} isLoading={isWithdrawing} disabled={isWithdrawing || claimableUnbondedStakes.lte(ZERO_DECIMAL)}>Claim</Button>
                            }
                          </Flex>
                          <Flex alignItems="center" mt={1} fontSize="xs" color="gray">
                            <Text>Last claimable: {dayjs(unbondedStakes[0].unlockTime).format('YYYY-MM-DD HH:mm:ss')} ({DecimalUtils.beautify(unbondedStakes[0].amount)} OCT)</Text>
                          </Flex>
                        </Box>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover> : 
                  noEffectHistories?.length > 0 && currentEra ?
                  <Text fontSize="sm" color="gray">
                    {noEffectHistories.length} {noEffectHistories.length > 1 ? 'hisotries' : 'hisotry'} will be effected {dayjs.duration(Math.floor(nextEraTimeLeft / 1000), 'seconds').humanize(true)}
                  </Text> : null
                  // <CircularProgress value={(EPOCH_DURATION_MS - nextEraTimeLeft) / (EPOCH_DURATION_MS/100)} size={6}>
                  //   <CircularProgressLabel>{noEffectHistories.length}</CircularProgressLabel>
                  // </CircularProgress> : null
                  
              }
            </HStack>
        }
      </Flex>
      <Divider mt={3} mb={3} />

      <Skeleton isLoaded={!isLoading}>
        <Flex minH="90px" alignItems="center" justifyContent="center">
          {
            isInValidatorList ?
              <VStack spacing={4}>
                <HStack fontSize="md">
                  <Text>You Staked:</Text>
                  <Heading fontSize="md">{DecimalUtils.beautify(depositAmount)} OCT</Heading>
                </HStack>
                <HStack>
                  <Popover
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    isOpen={stakeMorePopoverOpen}
                    onClose={setStakeMorePopoverOpen.off}
                  >
                    <PopoverTrigger>
                      <Button colorScheme="octoColor" size="xs" variant="outline"
                        onClick={() => {
                          setStakeMorePopoverOpen.toggle();
                          setTimeout(() => (stakeAmountInputRef?.current as any)?.focus(), 100);
                        }}
                        isDisabled={stakeMorePopoverOpen}><AddIcon mr={1} boxSize={2} /> Increase</Button>
                    </PopoverTrigger>
                    
                    <PopoverContent>
                      <PopoverBody>
                        <Flex p={2}>
                          <Input placeholder="amount of OCT" ref={stakeAmountInputRef}
                            onChange={onAmountChange} type="number" />
                        </Flex>
                      </PopoverBody>
                      <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
                        <Text fontSize="sm" color="gray">
                          Staked: {
                            DecimalUtils.beautify(depositAmount)
                          } OCT
                        </Text>
                        <Button size="sm" onClick={onIncreaseStake} colorScheme="octoColor"
                          isLoading={isStaking} isDisabled={isStaking || inputAmount.lte(ZERO_DECIMAL)}>Increase Stake</Button>
                      </PopoverFooter>
                    </PopoverContent>
                  </Popover>
                  <Popover
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    isOpen={decreaseStakePopoverOpen}
                    onClose={setDecreaseStakePopoverOpen.off}
                  >
                    <PopoverTrigger>
                      <Button colorScheme="octoColor" size="xs" variant="outline"
                        onClick={() => {
                          setDecreaseStakePopoverOpen.toggle();
                          setTimeout(() => (decreaseStakeAmountInputRef?.current as any)?.focus(), 100);
                        }}
                        isDisabled={decreaseStakePopoverOpen}><MinusIcon mr={1} boxSize={2} /> Decrease</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverBody>
                        <Box p={2}>
                          <Flex>
                            <Input placeholder="amount of OCT" ref={decreaseStakeAmountInputRef}
                              onChange={onDecreaseAmountChange} type="number" />
                          </Flex>
                          <Flex mt={2}>
                            <Button onClick={onDecreaseStake} colorScheme="octoColor" isFullWidth
                              isLoading={isStaking} isDisabled={isStaking || decreaseAmount.lte(ZERO_DECIMAL)}>Decrease Stake</Button>
                          </Flex>
                        </Box>
                      </PopoverBody>
                      
                    </PopoverContent>
                  </Popover>
                  <Popover
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    isOpen={unbondPopoverOpen}
                    onClose={setUnbondPopoverOpen.off}
                  >
                    <PopoverTrigger>
                      <Button colorScheme="red" size="xs" variant="outline"
                        onClick={setUnbondPopoverOpen.toggle}
                        isDisabled={unbondPopoverOpen}><CloseIcon mr={1} boxSize={2} /> Unbond</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverBody>
                        <Flex p={2}>
                          <Heading fontSize="lg">Are you confirm to unbond stake?</Heading>
                        </Flex>
                      </PopoverBody>
                      <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
                        <Text fontSize="sm" color="gray">
                          Staked: {
                            DecimalUtils.beautify(depositAmount)
                          } OCT
                        </Text>
                        <Button size="sm" onClick={onUnbond} colorScheme="octoColor"
                          isLoading={isUnbonding} isDisabled={isUnbonding}>Confirm</Button>
                      </PopoverFooter>
                    </PopoverContent>
                  </Popover>
                </HStack>
              </VStack> :
              <HStack w="80%" justifyContent="center">
                {
                  unbondedStakes?.length > 0 ?
                    <Text fontSize="sm" color="gray" textAlign="center">
                      <InfoIcon /> You have unbonded stakes util {dayjs(unbondedStakes[unbondedStakes.length - 1].unlockTime).format('YYYY-MM-DD HH:mm:ss')},
                      you will not be able to register validator before this time.
                    </Text> :
                    <Button size="sm" colorScheme="octoColor" onClick={setRegisterModalOpen.on} isDisabled={!globalStore.accountId}>
                      Register Validator
                    </Button>
                }

              </HStack>
          }
        </Flex>
      </Skeleton>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onDepositAlertClose}
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
            <Button ref={cancelRef} onClick={onDepositAlertClose}>
              Maybe Later
            </Button>
            <Button colorScheme="octoColor" ml={3} onClick={onDepositStorage}>
              Setup Right Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegisterModalOpen.off} anchorContract={anchorContract} />
    </>
  );
}