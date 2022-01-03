import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Box,
  List,
  Button,
  useToast
} from '@chakra-ui/react';

import { AnchorContract } from 'types';

import { useTranslation } from 'react-i18next';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import Decimal from 'decimal.js';
import { useGlobalStore } from 'stores';

import {
  FAILED_TO_REDIRECT_MESSAGE,
  Gas,
  OCT_TOKEN_DECIMALS
} from 'primitives';

type RegisterDelegatorModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  validatorAccountId: string;
  anchorContract: AnchorContract;
}

export const RegisterDelegatorModal: React.FC<RegisterDelegatorModalProps> = ({
  isOpen,
  onClose,
  validatorAccountId,
  anchorContract
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const globalStore = useGlobalStore(state => state.globalStore);
  const [amount, setAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [minimumDeposit, setMinimumDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [accountBalance, setAccountBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!anchorContract || !globalStore.accountId) {
      return;
    }
    
    Promise.all([
      anchorContract
        .get_protocol_settings(),

      globalStore
        .tokenContract
        .ft_balance_of({
          account_id: globalStore.accountId
        })
    ]).then(([{ minimum_delegator_deposit }, balance]) => {
      setMinimumDeposit(
        DecimalUtils.fromString(minimum_delegator_deposit, OCT_TOKEN_DECIMALS)
      );
      setAccountBalance(
        DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS)
      );
      setAmount(
        DecimalUtils.fromString(minimum_delegator_deposit, OCT_TOKEN_DECIMALS)
      );
    });

  }, [anchorContract, globalStore]);

  const onChangeAmount = ({ target: { value } }) => {
    setAmount(DecimalUtils.fromString(value));
  }

  const onSubmit = () => {

    setIsSubmitting(true);

    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchorContract.contractId,
          amount: DecimalUtils.toU64(amount, OCT_TOKEN_DECIMALS).toString(),
          msg: JSON.stringify({
            RegisterDelegator: {
              validator_id: validatorAccountId
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
        setIsSubmitting(false);
        console.log(err);
      });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delegate on {validatorAccountId}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <List spacing={4}>

            <FormControl isRequired>
              <FormLabel htmlFor="amount">{t('Deposit Amount')}</FormLabel>
              <Input id="amount" placeholder="deposit amount" onChange={onChangeAmount}
                defaultValue={amount.toNumber() || ''} type="number" autoFocus />
              <FormHelperText>
                minimum deposit: {DecimalUtils.beautify(minimumDeposit)} OCT
              </FormHelperText>
            </FormControl>

          </List>
          <Button mt={8} isFullWidth colorScheme="octoColor" type="submit" isLoading={isSubmitting} disabled={
            amount.lt(minimumDeposit) || amount.gt(accountBalance) || isSubmitting
          } onClick={onSubmit}>
            {
              !amount ?
                'Delegate' :
                (
                  amount.lt(minimumDeposit) ? 'Minimum Limit' :
                    amount.gt(accountBalance) ? 'Insufficient Balance' :
                      'Delegate'
                )

            }
          </Button>
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}
