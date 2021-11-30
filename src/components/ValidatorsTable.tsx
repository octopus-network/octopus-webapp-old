import React, { useEffect, useState, useMemo } from 'react';
import { ApiPromise } from '@polkadot/api';
import IdentityIcon from '@polkadot/react-identicon';

import {
  Table,
  Thead,
  Tbody,
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  Tooltip,
  Input,
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
  AppchainInfo
} from 'types';

import { Link as RouterLink } from 'react-router-dom';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { RegisterDelegatorModal } from 'components';
import { FAILED_TO_REDIRECT_MESSAGE, Gas, OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { encodeAddress } from '@polkadot/util-crypto';
import { useGlobalStore } from 'stores';

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
  base58Address
}) => {
  const [delegatedDeposits, setDelegatedDeposits] = useState(ZERO_DECIMAL);
  
  const [delegateAmount, setDelegateAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [delegateMorePopoverOpen, setDelegateMorePopoverOpen] = useBoolean(false);
  const [isDelegating, setIsDelegating] = useState(false);

  const toast = useToast();
  const globalStore = useGlobalStore(state => state.globalStore);

  const initialFocusRef = React.useRef();
  const delegateAmountInputRef = React.useRef<any>();
  const [rewards, setRewards] = useState<RewardHistory[]>();

  useEffect(() => {
    if (delegateMorePopoverOpen) {
      setTimeout(() => {
        if (delegateAmountInputRef.current) {
          delegateAmountInputRef.current.focus();
        }
      }, 200);
    }
  }, [delegateMorePopoverOpen]);

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
   
    if (!anchorContract || !currentEra || currentEra <= 0 || !appchain) {
      return;
    }

    anchorContract
      .get_validator_rewards_of({
        start_era: '0',
        end_era: currentEra.toString(),
        validator_id: validator.validatorId
      }).then(rewards => {
        setRewards(rewards.map(({ reward, is_withdrawn, era_number }) => ({
          reward: DecimalUtils.fromString(reward, appchain.appchainMetadata.fungibleTokenMetadata.decimals),
          isWithdrawn: is_withdrawn,
          eraNumber: (era_number as any) * 1
        })));
      });

  }, [anchorContract, currentEra, appchain, validator]);

  // useEffect(() => {
  //   console.log(apiPromise?.query?.octopusLpos);
  //   apiPromise?.query?.octopusLpos?.erasStakers(3, '5FRzbdg5WEQQPu34pdowRehCfA4rgZuDQE4bQEbcWGnthegY').then(res => {
  //     console.log(res.toJSON());
  //   });
  // }, [apiPromise]);

  const unwithdraedAmount = useMemo(() => {
    if (!rewards?.length) {
      return ZERO_DECIMAL;
    }

    return rewards.filter(r => !r.isWithdrawn)
      .reduce((total, next) => total.plus(next.reward), ZERO_DECIMAL);

  }, [rewards]);

  const totalRewards = useMemo(() => rewards ?
    rewards.reduce((total, next) => total.plus(next.reward), ZERO_DECIMAL) : ZERO_DECIMAL, 
    [rewards]
  );

  const onIncreaseDelegation = (id) => {
    setIsDelegating(true);
    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchorContract.contractId,
          amount: delegateAmount.toString(),
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

  const onDelegateAmountChange = ({ target: { value } }) => {
    setDelegateAmount(DecimalUtils.fromString(value));
  }

  const isYou = useMemo(() => globalStore && validator &&
    (globalStore?.accountId === validator?.validatorId), [globalStore, validator]);

  return (
    <Tr>
      <Td>
        <VStack alignItems="flex-start" spacing={1}>
          <HStack>
            <Box borderRadius="full" overflow="hidden" borderWidth={1} w="22px" h="22px">
              <IdentityIcon size={20} value={base58Address} />
            </Box>
            <Link as={RouterLink} to={`/profile/${validator.validatorId}@${appchainId}`}
              _hover={{ textDecoration: 'underline' }} title={isYou ? 'Is you:)' : ''}>
              <Text>{validator.validatorId}</Text>
            </Link>
            {
              isInAppchain ?
              <Box transform="scale(.8)" transformOrigin="left">
                <Tooltip label="Great! You are in the appchain validator list.">
                  <Badge colorScheme="yellow" variant="outline" borderRadius="xl">Staking</Badge>
                </Tooltip>
              </Box> : 
              <Box transform="scale(.8)" transformOrigin="left">
                <Tooltip label="You are not in appchain validator list yet, you may have to wait until the next era.">
                <Badge colorScheme="blue" variant="outline" borderRadius="xl">Staker</Badge>
                </Tooltip>
              </Box>
            }
          </HStack>
          
          <Text fontSize="xs" color="gray">
            Rewards: {DecimalUtils.beautify(totalRewards)} {appchain?.appchainMetadata.fungibleTokenMetadata.symbol}
            {
              unwithdraedAmount.gt(ZERO_DECIMAL) ? 
              `, unclaimed: ${DecimalUtils.beautify(unwithdraedAmount)} ${appchain?.appchainMetadata.fungibleTokenMetadata.symbol}` : ''
            }
          </Text>
        </VStack>
      </Td>
      
      <Td textAlign="center">{ DecimalUtils.beautify(validator.depositAmount) } OCT</Td>
      <Td textAlign="center">{ DecimalUtils.beautify(validator.totalStake.sub(validator.depositAmount))} OCT</Td>
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
                  <Popover
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    isOpen={delegateMorePopoverOpen}
                    onClose={setDelegateMorePopoverOpen.off}
                  >
                    <PopoverTrigger>
                      <Button size="xs" colorScheme="octoColor" onClick={setDelegateMorePopoverOpen.toggle}
                        isDisabled={delegateMorePopoverOpen || !validator.canBeDelegatedTo} variant="outline">Delegate more</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverBody>
                        <Flex p={2}>
                          <Input placeholder="amount of OCT" ref={delegateAmountInputRef}
                            onChange={onDelegateAmountChange} />
                        </Flex>
                      </PopoverBody>
                      <PopoverFooter d="flex" justifyContent="flex-end">
                        <HStack spacing={3}>
                          {/* <Button size="sm" onClick={setDelegateMorePopoverOpen.off}>Cancel</Button> */}
                          <Button size="sm" onClick={() => onIncreaseDelegation(validator.validatorId)} colorScheme="octoColor"
                            isLoading={isDelegating} isDisabled={isDelegating}>Delegate</Button>
                        </HStack>
                      </PopoverFooter>
                    </PopoverContent>
                  </Popover> :
                  <Button size="xs" colorScheme="octoColor" variant="outline" onClick={() => onRegisterDelegator(validator.validatorId)}
                    isDisabled={true}>Delegate</Button>
            }
          </Td> : false
      }
    </Tr>
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
  
  useEffect(() => {

    if (!anchorContract) {
      return;
    }

    anchorContract
      .get_validator_list_of()
      .then(res => {
        setValidatorList(res.map(v => ({
          validatorId: v.validator_id,
          validatorIdInAppchain: v.validator_id_in_appchain,
          depositAmount: DecimalUtils.fromString(v.deposit_amount, OCT_TOKEN_DECIMALS),
          totalStake: DecimalUtils.fromString(v.total_stake, OCT_TOKEN_DECIMALS),
          delegatorsCount: v.delegators_count as any * 1,
          canBeDelegatedTo: v.can_be_delegated_to
        })));
      });

  }, [anchorContract]);

  useEffect(() => {
    
    if (apiPromise) {
      setTimeout(() => {
        apiPromise?.query?.session?.validators()
          .then(vs => {
            setAppchainValidators(vs.map(v => v.toString()));
          });
      }, 1000);
    }
  }, [apiPromise]);

  const onRegisterDelegator = (id: string) => {
    setSelectedValidatorAccountId(id);
    setRegisterDelegatorModalOpen.on();
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
                  <Th textAlign="center">Own Stake</Th>
                  <Th textAlign="center">Other Stake</Th>
                  <Th textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>Delegators</Th>
                  {
                    noAction !== true ?
                      <Th>Action</Th> : null
                  }
                </Tr>
              </Thead>
              <Tbody>
                {
                  validatorList.map((v, idx) => {
                    const base58Address = encodeAddress(v.validatorIdInAppchain);

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
    </>
  );
}
