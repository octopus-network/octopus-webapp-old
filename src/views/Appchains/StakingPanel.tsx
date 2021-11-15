import React, { useEffect, useState } from 'react';

import {
  Flex,
  Heading,
  Button,
  Box,
  HStack,
  useBoolean,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  Input,
  useToast,
  Skeleton,
} from '@chakra-ui/react';

import { 
  OriginAppchainInfo, 
  AnchorContract, 
  AppchainState
} from 'types';

import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { useTranslation } from 'react-i18next';
import { RegisterValidatorModal, ValidatorsTable } from 'components';
import { FAILED_TO_REDIRECT_MESSAGE, Gas, OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { useGlobalStore } from 'stores';

type StakingPanelProps = {
  appchain: OriginAppchainInfo;
  anchorContract: AnchorContract;
}

const StakingPanel: React.FC<StakingPanelProps> = ({ appchain, anchorContract }) => {
 
  const toast = useToast();
  const globalStore = useGlobalStore(state => state.globalStore);
  const [depositAmount, setDepositAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [inputAmount, setInputAmount] = useState<Decimal>(ZERO_DECIMAL);
 
  const [registerModalOpen, setRegisterModalOpen] = useBoolean(false);
  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);
  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);

  const [isUnbonding, setIsUnbonding] = useState(false);
  const [isStaking, setIsStaking] = useState(false);

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const { t } = useTranslation();

  useEffect(() => {
    if (!anchorContract) {
      return;
    }

    Promise.all([
      anchorContract
        .get_validator_deposit_of({
          validator_id: globalStore.accountId
        }),
      anchorContract
        .get_unbonded_stakes_of({
          account_id: globalStore.accountId
        })
    ]).then(([deposit]) => {
      setDepositAmount(
        DecimalUtils.fromString(deposit, OCT_TOKEN_DECIMALS)
      );
    });
    
  }, [anchorContract, globalStore]);

  useEffect(() => {
    if (stakeMorePopoverOpen) {
      if (stakeAmountInputRef.current) {
        setTimeout(() => {
          (stakeAmountInputRef.current as any).focus();
        }, 200);
      }
    }
  }, [stakeMorePopoverOpen]);

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

  return (
    <>
    <Box>
      <Skeleton isLoaded={depositAmount !== undefined}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="lg">Validators</Heading>
        {
          depositAmount.gt(ZERO_DECIMAL) ?
          
          <HStack>
            <Text fontSize="sm" color="gray">
              Staked: {
                DecimalUtils.beautify(depositAmount)
              } OCT
            </Text>
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={stakeMorePopoverOpen}
              onClose={setStakeMorePopoverOpen.off}
              >
              <PopoverTrigger>
                <Button size="sm" colorScheme="octoColor" onClick={setStakeMorePopoverOpen.toggle}
                  isDisabled={stakeMorePopoverOpen}>Stake more</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <Flex p={2}>
                    <Input placeholder="amount of OCT" ref={stakeAmountInputRef} 
                      onChange={onAmountChange} type="number" />
                  </Flex>
                </PopoverBody>
                <PopoverFooter d="flex" justifyContent="flex-end">
                  <HStack spacing={3}>
                    {/* <Button size="sm" onClick={setStakeMorePopoverOpen.off}>{t('Cancel')}</Button> */}
                    <Button size="sm" onClick={onIncreaseStake} colorScheme="octoColor" 
                      isLoading={isStaking} isDisabled={isStaking}>{t('Stake')}</Button>
                  </HStack>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
            {
              appchain.appchain_state === AppchainState.Active ?
              <>
                <Button size="sm">Decrease</Button>
                <Popover
                  initialFocusRef={initialFocusRef}
                  placement="bottom"
                  isOpen={unbondPopoverOpen}
                  onClose={setUnbondPopoverOpen.off}
                  >
                  <PopoverTrigger>
                    <Button size="sm" colorScheme="red" onClick={setUnbondPopoverOpen.toggle}
                      isDisabled={unbondPopoverOpen}>Unbond</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverBody>
                      <Flex p={2}>
                        <Heading fontSize="lg">Are you confirm to unbond stake?</Heading>
                      </Flex>
                    </PopoverBody>
                    <PopoverFooter d="flex" justifyContent="flex-end">
                      <HStack spacing={3}>
                        {/* <Button size="sm" onClick={setUnbondPopoverOpen.off}>{t('Cancel')}</Button> */}
                        <Button size="sm" onClick={onUnbond} colorScheme="octoColor" 
                          isLoading={isUnbonding} isDisabled={isUnbonding}>{t('Confirm')}</Button>
                      </HStack>
                    </PopoverFooter>
                  </PopoverContent>
                </Popover>
              </> : null
            }
          </HStack> :

          <Button size="sm" colorScheme="octoColor" onClick={setRegisterModalOpen.on}>Register Validator</Button>
       
        }
      </Flex>
      </Skeleton>
      <Box mt={4} p={2} borderWidth={1} borderRadius={10}>
        <ValidatorsTable anchorContract={anchorContract} appchainId={appchain.appchain_id} />
      </Box>
      
    </Box>
    <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegisterModalOpen.off}
      anchorContract={anchorContract} />
    </>
  );
}

export default StakingPanel;