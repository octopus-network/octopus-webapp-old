import React, { BaseSyntheticEvent, useEffect, useState, useMemo } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  List,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Select,
  Button,
  Icon,
  HStack,
  Text,
  Divider,
  Tag,
  useBoolean,
  Box,
  IconButton,
  Flex,
  useToast,
  TagLabel,
  TagCloseButton,
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
  PopoverFooter
} from '@chakra-ui/react';

import BN from 'bn.js';

import {
  AppchainInfo,
  Task,
  TaskState,
  OriginTask,
  AnchorContract,
  TokenContract,
  AccountId,
  RewardHistory
} from 'types';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { TasksTable } from './TasksTable';
import { deployConfig, octopusConfig } from 'config';
import { useGlobalStore } from 'stores';
import axios from 'axios';
import { ZERO_DECIMAL, DecimalUtils } from 'utils';
import { RegisterValidatorModal } from 'components';
import { SetSessionKeyModal } from './SetSessionKeyModal';
import { OCT_TOKEN_DECIMALS, Gas, FAILED_TO_REDIRECT_MESSAGE } from 'primitives';
import { RepeatIcon } from '@chakra-ui/icons';
import { ApiPromise } from '@polkadot/api';

type ValidatorPanelProps = {
  currentEra: number;
  anchorContract: AnchorContract;
  appchain: AppchainInfo;
  apiPromise: ApiPromise;
  isOpen: boolean;
  onClose: VoidFunction;
  onSwitchMode: VoidFunction;
}

export const ValidatorPanel: React.FC<ValidatorPanelProps> = ({ 
  appchain, 
  isOpen, 
  onClose, 
  anchorContract,
  currentEra, 
  apiPromise,
  onSwitchMode
}) => {
  const [inputAccessKey, setInputAccessKey] = useState();
  const [accessKey, setAccessKey] = useState(window.localStorage.getItem('accessKey'));
  const [cloudVendor] = useState('AWS');
  const toast = useToast();

  const [isUnbonding, setIsUnbonding] = useState(false);
  const [isDeploying, setIsDeploying] = useBoolean(false);
  const [isInDeploy, setIsInDeploy] = useBoolean(false);
  const [isInValidatorList, setIsInValidatorList] = useState(false);

  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean(false);
  const [registerModalOpen, setRegisterModalOpen] = useBoolean(false);
  const [image, setImage] = useState<string>(deployConfig.baseImages[0].image);
  const globalStore = useGlobalStore(state => state.globalStore);
  const [tasks, setTasks] = useState<Task[]>();

  const [rewards, setRewards] = useState<RewardHistory[]>();
  const [wrappedAppchainTokenContractId, setWrappedAppchainTokenContractId] = useState<AccountId>();
  const [wrappedAppchainTokenStorageBalance, setWrappedAppchainTokenStorageBalance] = useState(ZERO_DECIMAL);
  const [depositAmount, setDepositAmount] = useState(ZERO_DECIMAL);
  const [isClaiming, setIsClaiming] = useState(false);
  const [depositAlertOpen, setDepositAlertOpen] = useBoolean(false);

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const cancelRef = React.useRef();

  const [inputAmount, setInputAmount] = useState(ZERO_DECIMAL);
  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);
  const [isStaking, setIsStaking] = useState(false);
  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);

  const authKey = useMemo(() => {
    return `appchain-${appchain?.appchainId}-cloud-${cloudVendor}-${accessKey}`;
  }, [appchain, cloudVendor, accessKey]);

  const haveDeployedNode = useMemo(() => !!tasks?.length && tasks[0].state.state === 12, [tasks]);

  useEffect(() => {
    if (!isOpen) {
      setInputAccessKey(null);
      setIsInDeploy.off();
    }

  }, [isOpen, setIsInDeploy]);


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

  const onRefresh = React.useRef<any>();

  onRefresh.current = () => {
    setTasks(null);
    axios.get(`${deployConfig.apiHost}/api/tasks`, {
      headers: {
        authorization: authKey
      }
    }).then(res => {

      const states: Record<string, TaskState> = {
        '0': { label: 'init', color: 'blue', state: 0 },
        '10': { label: 'applying', color: 'teal', state: 10 },
        '11': { label: 'apply failed', color: 'red', state: 11 },
        '12': { label: 'running', color: 'green', state: 12 },
        '20': { label: 'destroying', color: 'teal', state: 20 },
        '21': { label: 'destroy failed', color: 'orange', state: 21 },
        '22': { label: 'destroyed', color: 'gray', state: 22 }
      }

      setTasks(res.data.map((item: OriginTask): Task => ({
        uuid: item.uuid,
        state: states[item.state],
        user: item.user,
        instance:
          item.instance ? {
            user: item.instance.user,
            ip: item.instance.ip,
            sshKey: item.instance.ssh_key
          } : null,
        image: deployConfig.baseImages.find(image => image.image === item.task.base_image)
      })));
    });
  }

  useEffect(() => {
    if (authKey) {
      onRefresh.current();
    }
  }, [authKey]);

  const onChangeAccessKey = (e: BaseSyntheticEvent) => {
    setInputAccessKey(e.target.value);
  }

  const onNextStep = () => {
    window.localStorage.setItem('accessKey', inputAccessKey);
    setAccessKey(inputAccessKey);
  }

  const onAmountChange = ({ target: { value } }) => {
    setInputAmount(DecimalUtils.fromString(value));
  }

  const onLogout = () => {
    window.localStorage.removeItem('accessKey');
    setInputAccessKey(null);
    setAccessKey(null);
  }

  const onImageChange = (e: BaseSyntheticEvent) => {
    setImage(e.target.value);
  }

  const onDeploy = () => {
    setIsDeploying.on();
    axios
      .post(`${deployConfig.apiHost}/api/tasks`, {
        cloud_vendor: cloudVendor,
        access_key: accessKey,
        base_image: image,
        chain_spec: `${appchain?.appchainId}-${octopusConfig.networkId}`
      }, {
        headers: {
          authorization: authKey
        }
      })
      .then(res => res.data)
      .then(data => {
        setIsInDeploy.off();
        setIsDeploying.off();
        onRefresh.current();
      })
      .catch(err => {
        setIsDeploying.off();
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent maxW={
          !accessKey ?
            '480px' :
            isInDeploy ?
              '460px' :
              'container.lg'
        } transition="all .3s ease">
          <ModalHeader></ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box maxW="400px">
              {
                !accessKey ?
                  <Heading fontSize="xl">
                    Choose your cloud vendor and input the access key
                  </Heading> :
                  isInDeploy ?
                    <Heading fontSize="xl">
                      Deploy New Validator Node
                    </Heading> :
                    <HStack>
                      <Heading fontSize="xl">Validator Panel</Heading>
                      <Button size="xs" variant="ghost" colorScheme="octoColor" onClick={onSwitchMode}>Switch to Manual Deploy mode</Button>
                    </HStack>
              }
            </Box>
            {
              !accessKey ?
                <>
                  <Flex borderWidth={1} borderRadius="full" mt={4}>
                    <Select maxW="120px" borderWidth={0} borderRadius="full">
                      <option value="AWS">AWS</option>
                    </Select>
                    <Input type="text" placeholder="Access Key" borderRadius="full" borderWidth={0} autoFocus
                      onChange={e => onChangeAccessKey(e)} />
                  </Flex>
                  <Box mt={5}>
                    <Button
                      isFullWidth
                      borderRadius="full"
                      colorScheme="octoColor"
                      onClick={onNextStep}
                      isDisabled={!inputAccessKey}>
                      Enter <Icon as={HiOutlineArrowNarrowRight} ml={2} />
                    </Button>
                  </Box>
                  <Box mt={3}>
                    <Button
                      isFullWidth
                      borderRadius="full"
                      
                      onClick={onSwitchMode}
                      variant="ghost">
                      Manual Deploy Mode
                    </Button>
                  </Box>
                </> :
                isInDeploy ?
                  <List mt={4} spacing={4}>
                    <FormControl>
                      <FormLabel>Cloud Vendor</FormLabel>
                      <Input type="text" defaultValue={cloudVendor} isDisabled />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Access Key</FormLabel>
                      <Input type="text" defaultValue={accessKey} isDisabled />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Base Image</FormLabel>
                      <Select onChange={onImageChange} value={image}>
                        {
                          deployConfig.baseImages.map((image, idx) => (
                            <option value={image.image} key={`option-${idx}`}>{image.label}</option>
                          ))
                        }

                      </Select>
                    </FormControl>
                    <Flex justifyContent="flex-end">
                      <HStack>
                        <Button colorScheme="octoColor" onClick={onDeploy}
                          isDisabled={isDeploying} isLoading={isDeploying}>Deploy</Button>
                        <Button onClick={setIsInDeploy.off} isDisabled={isDeploying}>Cancel</Button>
                      </HStack>
                    </Flex>
                  </List> :
                  <>
                    <Flex mt={4} justifyContent="space-between" alignItems="center">
                      <HStack>
                        <Text color="gray">Cloud Vender: {cloudVendor}, Access Key:</Text>
                        <Tag>
                          <TagLabel>{accessKey}</TagLabel>
                          <TagCloseButton onClick={onLogout} />
                        </Tag>
                      </HStack>
                      <HStack>
                        <IconButton aria-label="refresh" size="sm" variant="ghost" onClick={onRefresh.current}>
                          <RepeatIcon />
                        </IconButton>
                        {
                          haveDeployedNode ?
                            isInValidatorList ?
                              <HStack>
                                {
                                  unwithdraedAmount.gt(ZERO_DECIMAL) ?
                                    <Button colorScheme="octoColor" onClick={onClaimRewards} isLoading={isClaiming} isDisabled={isClaiming}>
                                      Claim {DecimalUtils.beautify(unwithdraedAmount)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
                                    </Button> :

                                    <>
                                      <Button colorScheme="octoColor" size="sm" onClick={setSetSessionKeyModalOpen.on}>Set Session Key</Button>
                                      <Popover
                                        initialFocusRef={initialFocusRef}
                                        placement="bottom"
                                        isOpen={stakeMorePopoverOpen}
                                        onClose={setStakeMorePopoverOpen.off}
                                      >
                                        <PopoverTrigger>
                                          <Button colorScheme="octoColor" size="sm" variant="outline"
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
                                    </>

                                }
                              </HStack> :
                              <Button size="sm" colorScheme="octoColor" onClick={setRegisterModalOpen.on}>
                                Register Validator
                              </Button> : null
                        }
                      </HStack>
                    </Flex>
                    <Divider mt={3} mb={3} />
                    <Box>
                      <TasksTable authKey={authKey} onGoDeploy={setIsInDeploy.on} tasks={tasks} onRefresh={onRefresh.current} />
                    </Box>
                  </>
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