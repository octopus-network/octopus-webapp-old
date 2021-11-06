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

import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { useTranslation } from 'react-i18next';
import { RegisterValidatorModal, ValidatorsTable } from 'components';
import { FAILED_TO_REDIRECT_MESSAGE, COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from 'config/constants';
import Decimal from 'decimal.js';

const StakingPanel = ({ status, anchor }) => {
  const { appchain_state } = status;
  const toast = useToast();
  const [depositAmount, setDepositAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [inputAmount, setInputAmount] = useState<Decimal>(ZERO_DECIMAL);
 
  const [registerModalOpen, setRegsiterModalOpen] = useBoolean(false);
  const [unbondPopoverOpen, setUnbondPopoverOpen] = useBoolean(false);
  const [stakeMorePopoverOpen, setStakeMorePopoverOpen] = useBoolean(false);

  const [isUnbonding, setIsUnbonding] = useState(false);
  const [isStaking, setIsStaking] = useState(false);

  const initialFocusRef = React.useRef();
  const stakeAmountInputRef = React.useRef();
  const { t } = useTranslation();

  useEffect(() => {
    Promise.all([
      anchor
        .get_validator_deposit_of({
          validator_id: window.accountId
        }),
      anchor
        .get_unbonded_stakes_of({
          account_id: window.accountId
        })
    ]).then(([deposit]) => {
      setDepositAmount(
        DecimalUtils.fromString(deposit, OCT_TOKEN_DECIMALS)
      );
    });
    
  }, [anchor]);

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
    anchor
      .unbond_stake()
      .then(_ => {
        window.location.reload();
      })
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
    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchor.contractId,
          amount: DecimalUtils.toU64(inputAmount, OCT_TOKEN_DECIMALS).toString(),
          msg: '"IncreaseStake"'
        },
        COMPLEX_CALL_GAS,
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
              appchain_state === 'Active' ?
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

          <Button size="sm" colorScheme="octoColor" onClick={setRegsiterModalOpen.on}>Register Validator</Button>
          // <Popover
          //   initialFocusRef={initialFocusRef}
          //   placement="bottom"
          //   isOpen={registerPopoverOpen}
          //   onClose={setRegisterPopoverOpen.off}
          //   >
          //   <PopoverTrigger>
          //     <Button colorScheme="octoColor"
          //       isDisabled={registerPopoverOpen} onClick={setRegisterPopoverOpen.on}>Register</Button>
          //   </PopoverTrigger>
          //   <PopoverContent>
          //     <PopoverBody>
          //       <Box p="2" d="flex">
          //         <Heading fontSize="lg">Register</Heading>
          //       </Box>
          //     </PopoverBody>
          //     <PopoverFooter d="flex" justifyContent="flex-end">
          //       <HStack spacing={3}>
          //         <Button size="sm" onClick={setRegisterPopoverOpen.off}>{t('Cancel')}</Button>
          //         <Button size="sm" colorScheme="octoColor">{t('Confirm')}</Button>
          //       </HStack>
          //     </PopoverFooter>
          //   </PopoverContent>
          // </Popover>
        }
      </Flex>
      </Skeleton>
      <Box mt={4} p={2} borderWidth={1} borderRadius={10}>
        <ValidatorsTable anchor={anchor} appchainId={status.appchain_id} />
      </Box>
      
    </Box>
    <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegsiterModalOpen.off}
      anchor={anchor} />
    </>
  );
}

export default StakingPanel;