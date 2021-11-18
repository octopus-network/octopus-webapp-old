import React, { useEffect, useState, useMemo } from 'react';

import {
  HStack,
  Button,
  useBoolean,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Flex,
  VStack,
  PopoverFooter,
  Input,
  useToast,
  Box,
  Icon,
  Heading,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogOverlay,
  AlertDialogFooter
} from '@chakra-ui/react';

import {
  TokenContract,
  AnchorContract, 
  AppchainInfo,
  RewardHistory,
  AccountId
} from 'types';

import { 
  OCT_TOKEN_DECIMALS, 
  Gas, 
  FAILED_TO_REDIRECT_MESSAGE 
} from 'primitives';

import { useGlobalStore } from 'stores';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import Decimal from 'decimal.js';
import BN from 'bn.js';

import { AiOutlineCloudServer } from 'react-icons/ai';

import { RegisterValidatorModal } from 'components';
import { DeployModal } from './DeployModal';

type PermissionsProps = {
  anchorContract: AnchorContract;
  appchain: AppchainInfo;
  currentEra: number;
}

export const Permissions: React.FC<PermissionsProps> = ({ anchorContract, appchain, currentEra }) => {

  const toast = useToast();
  const globalStore = useGlobalStore(state => state.globalStore);
  const [depositAmount, setDepositAmount] = useState<Decimal>(ZERO_DECIMAL);
 
  const [inputAmount, setInputAmount] = useState<Decimal>(ZERO_DECIMAL);

  // const [isAdmin, setIsAdmin] = useState(false);
  // const [accountBalance, setAccountBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [upvoteDeposit, setUpvoteDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [downvoteDeposit, setDownvoteDeposit] = useState<Decimal>(ZERO_DECIMAL);

  const [registerModalOpen, setRegisterModalOpen] = useBoolean(false);
  const [deployModalOpen, setDeployModalOpen] = useBoolean(false);

  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);
  const [isStaking, setIsStaking] = useState(false);

  const [withdrawVotesPopoverOpen, setWithdrawVotesPopoverOpen] = useBoolean(false);
  const [withdrawingUpvotes, setWithdrawingUpvotes] = useState(false);
  const [withdrawingDownvotes, setWithdrawingDownvotes] = useState(false);

  const [isUnbonding, setIsUnbonding] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [depositAlertOpen, setDepositAlertOpen] = useBoolean(false);
  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);

  const [rewards, setRewards] = useState<RewardHistory[]>();
  const [wrappedAppchainTokenContractId, setWrappedAppchainTokenContractId] = useState<AccountId>();
  // const [wrappedAppchainTokenFTBalance, setWrappedAppchainTokenFTBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState<Decimal>(ZERO_DECIMAL);

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const cancelRef = React.useRef();

  useEffect(() => {
    if (!anchorContract || !globalStore.accountId) {
      return;
    }
    Promise.all([
      anchorContract
        .get_validator_deposit_of({
          validator_id: globalStore.accountId
        }),

      anchorContract.get_wrapped_appchain_token(),

      anchorContract
        .get_unbonded_stakes_of({
          account_id: globalStore.accountId
        })
    ]).then(([deposit, wrappedToken]) => {
      setDepositAmount(
        DecimalUtils.fromString(
          deposit,
          OCT_TOKEN_DECIMALS
        )
      );

      setWrappedAppchainTokenContractId(wrappedToken.contract_account);

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
      
        // setWrappedAppchainTokenFTBalance(
        //   balance ? DecimalUtils.fromString(
        //     balance, 
        //     appchain?.appchainMetadata.fungibleTokenMetadata.decimals
        //   ) : ZERO_DECIMAL
        // );
      });
    });
  }, [anchorContract, globalStore, appchain]);

  useEffect(() => {
    if (!globalStore.accountId || !anchorContract ||!currentEra || !appchain) {
      return;
    }
    anchorContract
      .get_validator_rewards_of({
        start_era: '0',
        end_era: currentEra.toString(),
        validator_id: globalStore.accountId
      }).then(rewards => {
        setRewards(rewards.map(({ reward, is_withdrawn, era_number }) => ({
          reward: DecimalUtils.fromString(reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
          isWithdrawn: is_withdrawn,
          eraNumber: (era_number as any) * 1
        })));
      });

  }, [currentEra, globalStore, anchorContract, appchain]);

  const unwithdraedAmount = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.filter(r => !r.isWithdrawn)
        .reduce((total, next) => total.plus(next.reward), ZERO_DECIMAL);

  }, [rewards]);

  useEffect(() => {
    if (!appchain) return;
    Promise.all([
      globalStore.accountId ?
        globalStore
          .tokenContract
          .ft_balance_of({ account_id: globalStore.accountId }) : Promise.resolve('0'),

      globalStore
        .registryContract
        .get_upvote_deposit_for({
          appchain_id: appchain.appchainId,
          account_id: globalStore.accountId
        }),

      globalStore
        .registryContract
        .get_downvote_deposit_for({
          appchain_id: appchain.appchainId,
          account_id: globalStore.accountId
        }),

      globalStore.registryContract.get_owner()
    ]).then(([balance, upvoteDeposit, downvoteDeposit, owner]) => {
      // setAccountBalance(
      //   DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS)
      // );
      setUpvoteDeposit(
        DecimalUtils.fromString(upvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      setDownvoteDeposit(
        DecimalUtils.fromString(downvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      // setIsAdmin(owner === globalStore.accountId);
    });

  }, [appchain, globalStore]);

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

  const onAmountChange = ({ target: { value }}) => {
    setInputAmount(DecimalUtils.fromString(value));
  }

  const withdrawVotes = (type: string, amount: Decimal) => {
    const method = 
      type === 'upvote' ? 
      globalStore.registryContract.withdraw_upvote_deposit_of :
      globalStore.registryContract.withdraw_downvote_deposit_of;

    return method(
      {
        appchain_id: appchain.appchainId,
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
      await withdrawVotes('upvote', upvoteDeposit);
    } catch(err) {
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
      await withdrawVotes('downvote', downvoteDeposit);
    } catch(err) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }
    
    setWithdrawingDownvotes(false);
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
    } catch(err) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }

    setIsClaiming(false);
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

  return (
    <>
      <VStack alignItems="flex-end">
        <HStack>
          <Button colorScheme="octoColor" variant="outline"
            onClick={setDeployModalOpen.on}>
            <Icon as={AiOutlineCloudServer} mr={1} /> Deploy Tool
          </Button>
          {
            upvoteDeposit.gt(ZERO_DECIMAL) || downvoteDeposit.gt(ZERO_DECIMAL) ?
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={withdrawVotesPopoverOpen}
              onClose={setWithdrawVotesPopoverOpen.off}
            >
              <PopoverTrigger>
                <Button onClick={setWithdrawVotesPopoverOpen.on} colorScheme="octoColor" isDisabled={withdrawVotesPopoverOpen}>
                  Withdraw Votes
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <Box p={2}>
                    {
                      upvoteDeposit.gt(ZERO_DECIMAL) ?
                        <Flex>
                          <Text>
                            Your Upvotes: {DecimalUtils.beautify(upvoteDeposit)}
                          </Text> d
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                        </Flex> : null
                    }
                    {
                      downvoteDeposit.gt(ZERO_DECIMAL) ?
                        <Flex mt={3}>
                          <Text>
                            Your Downvotes: {DecimalUtils.beautify(downvoteDeposit)}
                          </Text>
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingDownvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawDownvotes}>Withdraw</Button>
                        </Flex> : null
                    }

                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover> :
            unwithdraedAmount.gt(ZERO_DECIMAL) ?
            <Button colorScheme="octoColor" onClick={onClaimRewards} isLoading={isClaiming} isDisabled={isClaiming}>
              Claim { DecimalUtils.beautify(unwithdraedAmount) } {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
            </Button> : 
            depositAmount.lte(ZERO_DECIMAL) ?
            
            <Button colorScheme="octoColor" isDisabled={!globalStore.accountId}
              onClick={setRegisterModalOpen.on}>
              Register Validator
            </Button> : null
          }
        </HStack>
        {
          depositAmount.gt(ZERO_DECIMAL) ?
          <HStack>
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={stakeMorePopoverOpen}
              onClose={setStakeMorePopoverOpen.off}
              >
              <PopoverTrigger>
                <Button colorScheme="octoColor" size="sm" variant="ghost"
                  onClick={setStakeMorePopoverOpen.toggle}
                  isDisabled={stakeMorePopoverOpen}>Stake more</Button>
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
                    isLoading={isStaking} isDisabled={isStaking}>Stake More</Button>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={unbondPopoverOpen}
              onClose={setUnbondPopoverOpen.off}
              >
              <PopoverTrigger>
                <Button colorScheme="red" size="sm" variant="ghost"
                  onClick={setUnbondPopoverOpen.toggle}
                  isDisabled={unbondPopoverOpen}>Unbond</Button>
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
          </HStack> : null
        }
      
      </VStack>
      <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegisterModalOpen.off}
        anchorContract={anchorContract} />

      <DeployModal isOpen={deployModalOpen} onClose={setDeployModalOpen.off}
        appchain={appchain} />

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
    </>
  );
}