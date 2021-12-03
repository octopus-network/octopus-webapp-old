import React, { useEffect, useState, useMemo } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  Heading,
  Divider,
  Button,
  Icon,
  HStack,
  Text,
  useBoolean,
  Box,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogOverlay,
  AlertDialogFooter,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  VStack
} from '@chakra-ui/react';

import BN from 'bn.js';

import {
  AppchainInfo,
  AnchorContract,
  TokenContract,
  AccountId,
  RewardHistory
} from 'types';

import { useGlobalStore } from 'stores';
import { ZERO_DECIMAL, DecimalUtils } from 'utils';
import { RegisterValidatorModal } from 'components';
import { SetSessionKeyModal } from './SetSessionKeyModal';
import { OCT_TOKEN_DECIMALS, Gas, FAILED_TO_REDIRECT_MESSAGE } from 'primitives';
import { ApiPromise } from '@polkadot/api';
import { BsFillInfoCircleFill } from 'react-icons/bs';

type ValidatorPanelProps = {
  currentEra: number;
  anchorContract: AnchorContract;
  appchain: AppchainInfo;
  apiPromise: ApiPromise;
  isOpen: boolean;
  onClose: VoidFunction;
  onSwitchMode: VoidFunction;
}

export const ValidatorPanelManual: React.FC<ValidatorPanelProps> = ({
  appchain,
  isOpen,
  onClose,
  anchorContract,
  currentEra,
  apiPromise,
  onSwitchMode
}) => {
  const toast = useToast();

  const [isUnbonding, setIsUnbonding] = useState(false);

  const globalStore = useGlobalStore(state => state.globalStore);

  const [isClaiming, setIsClaiming] = useState(false);
  const [isStaking, setIsStaking] = useState(false);

  const [inputAmount, setInputAmount] = useState(ZERO_DECIMAL);
  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);

  const [wrappedAppchainTokenContractId, setWrappedAppchainTokenContractId] = useState<AccountId>();
  const [depositAlertOpen, setDepositAlertOpen] = useBoolean(false);
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean(false);
  const [registerModalOpen, setRegisterModalOpen] = useBoolean(false);
  const [isInValidatorList, setIsInValidatorList] = useState(false);

  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);
  const [rewards, setRewards] = useState<RewardHistory[]>();
  const [depositAmount, setDepositAmount] = useState(ZERO_DECIMAL);
  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState(ZERO_DECIMAL);

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const cancelRef = React.useRef();

  const unwithdraedAmount = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.reduce((total, next) => total.plus(next.unwithdrawn_reward), ZERO_DECIMAL);

  }, [rewards]);

  useEffect(() => {
    if (anchorContract) {
      anchorContract
        .get_validator_list_of()
        .then(res => {
          setIsInValidatorList(
            res.some(v => v.validator_id === globalStore.accountId)
          );
        });
    }
  }, [anchorContract, globalStore]);

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

  const onAmountChange = ({ target: { value } }) => {
    setInputAmount(DecimalUtils.fromString(value));
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent maxW="container.md">
          <ModalHeader></ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <HStack>
                <Heading fontSize="xl">Validator Panel</Heading>
                <Button size="xs" variant="ghost" colorScheme="octoColor" onClick={onSwitchMode}>Switch to Auto Deploy mode</Button>
              </HStack>
            </Box>
            <Divider mt={4} mb={4} />
            {
              isInValidatorList ?
                <Flex minH="160px" alignItems="center" justifyContent="center" flexDirection="column">
                  <HStack>
                    {
                      unwithdraedAmount.gt(ZERO_DECIMAL) ?
                        <Button colorScheme="octoColor" onClick={onClaimRewards} isLoading={isClaiming} isDisabled={isClaiming}>
                          Claim {DecimalUtils.beautify(unwithdraedAmount)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
                        </Button> : null
                    }
                    <Button colorScheme="octoColor" onClick={setSetSessionKeyModalOpen.on}>Set Session Key</Button>
                  </HStack>
                  <HStack mt={3}>
                    <Popover
                      initialFocusRef={initialFocusRef}
                      placement="bottom"
                      isOpen={stakeMorePopoverOpen}
                      onClose={setStakeMorePopoverOpen.off}
                    >
                      <PopoverTrigger>
                        <Button colorScheme="octoColor" variant="outline"
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
                        <Button colorScheme="red"
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
                  </HStack>
                </Flex> :
                <Flex minH="180px" flexDirection="column" alignItems="center" justifyContent="center">
                  <VStack color="gray">
                    <Icon as={BsFillInfoCircleFill} boxSize={10} />
                    <Heading fontSize="md" textAlign="center" maxW="320px">
                      It seems that you haven't register validator yet
                    </Heading>
                  </VStack>
                  <Button size="sm" colorScheme="octoColor" mt={4} onClick={setRegisterModalOpen.on}>Register Validator</Button>
                </Flex>
            }

            <Box pb={6} />
          </ModalBody>
        </ModalContent>
      </Modal>

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

      <SetSessionKeyModal isOpen={setSessionKeyModalOpen} onClose={setSetSessionKeyModalOpen.off} apiPromise={apiPromise} />
      <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegisterModalOpen.off} anchorContract={anchorContract} />
    </>
  );
}