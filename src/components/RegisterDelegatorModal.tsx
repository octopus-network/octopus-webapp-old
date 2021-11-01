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

import { useTranslation } from 'react-i18next';
import { fromDecimals, toDecimals } from 'utils';
import { FAILED_TO_REDIRECT_MESSAGE, COMPLEX_CALL_GAS } from 'config/constants';

export const RegisterDelegatorModal = ({ 
  isOpen, 
  onClose,
  validatorAccountId,
  anchor
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  validatorAccountId: string;
  anchor: any;
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [amount, setAmount] = useState<any>('');
  
  const [minimumDeposit, setMinimumDeposit] = useState<any>();
  const [accountBalance, setAccountBalance] = useState<any>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      anchor
        .get_protocol_settings(),

      window
        .tokenContract
        .ft_balance_of({
          account_id: window.accountId
        })
    ]).then(([{ minimum_delegator_deposit }, balance]) => {
      setMinimumDeposit(fromDecimals(minimum_delegator_deposit));
      setAccountBalance(fromDecimals(balance));
      setAmount(fromDecimals(minimum_delegator_deposit));
    });
    
  }, [anchor]);

  const onChangeAmount = ({ target: { value } }) => {
    setAmount(value * 1);
  }

  const onSubmit = () => {

    setIsSubmitting(true);

    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchor.contractId,
          amount: toDecimals(amount),
          msg: JSON.stringify({
            RegisterDelegator: {
              validator_id: validatorAccountId
            }
          })
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
              <Input id="amount" placeholder="deposit amount" onChange={onChangeAmount} defaultValue={amount} type="number" autoFocus />
              <FormHelperText>minimum deposit: {minimumDeposit} OCT</FormHelperText>
            </FormControl>
           
          </List>
          <Button mt={8} isFullWidth colorScheme="octoColor" type="submit" isLoading={isSubmitting} disabled={
            !amount || amount < minimumDeposit || amount > accountBalance || isSubmitting
          } onClick={onSubmit}>
            {
              !amount ?
              'Delegate' :
              (
                amount < minimumDeposit ? 'Minimum Limit' :
                amount > accountBalance ? 'Insufficient Balance' :
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
