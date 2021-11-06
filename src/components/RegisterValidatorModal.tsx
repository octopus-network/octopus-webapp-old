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
  HStack,
  Switch,
  Input,
  Box,
  Text,
  List,
  Button,
  Flex,
  useToast,
  Link
} from '@chakra-ui/react';

import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { useTranslation } from 'react-i18next';
import { fromDecimals, toDecimals } from 'utils';
import { FAILED_TO_REDIRECT_MESSAGE, COMPLEX_CALL_GAS } from 'config/constants';

export const RegisterValidatorModal = ({ 
  isOpen, 
  onClose,
  anchor
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  anchor: any;
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [amount, setAmount] = useState<any>('');
  const [validatorId, setValidatorId] = useState<any>('');
  const [canBeDelegatedTo, setCanBeDelegatedTo] = useState(false);
  const [minimumDeposit, setMinimumDeposit] = useState<any>();
  const [accountBalance, setAccountBalance] = useState<any>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialMediaHandle, setSocialMediaHandle] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([
      anchor
        .get_protocol_settings(),

      window
        .tokenContract
        .ft_balance_of({
          account_id: window.accountId
        })
    ]).then(([{ minimum_validator_deposit }, balance]) => {
      setMinimumDeposit(fromDecimals(minimum_validator_deposit));
      setAccountBalance(fromDecimals(balance));
      setAmount(fromDecimals(minimum_validator_deposit));
    });
    
  }, [anchor]);

  const onChangeAmount = ({ target: { value } }) => {
    setAmount(value * 1);
  }

  const onChangeValidatorId = ({ target: { value } }) => {
    setValidatorId(value);
  }

  const onSubmit = () => {
    
    let hexId = '';
    try {
      const u8a = decodeAddress(validatorId);
      hexId = u8aToHex(u8a);
    } catch(err) {

      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Invalid base58 address',
        status: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchor.contractId,
          amount: toDecimals(amount),
          msg: JSON.stringify({
            RegisterValidator: {
              validator_id_in_appchain: hexId,
              can_be_delegated_to: canBeDelegatedTo,
              profile: {
                socialMediaHandle: socialMediaHandle || '',
                email
              }
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
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          
          <List spacing={4} mt={4}>
            <FormControl isRequired>
              <Flex alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="validatorId">{t('Validator Account')}</FormLabel>
                <Link isExternal href="https://docs.oct.network/maintain/validator-generate-keys.html#generate-validator-account">
                  <Text fontSize="sm" color="octoColor.500">How to?</Text>
                </Link>
              </Flex>
              <Input id="validatorId" placeholder="appchain base58 address, eg: 5CaLqqE3..." onChange={onChangeValidatorId} autoFocus />
            </FormControl>
            <FormControl isRequired>
              <FormLabel htmlFor="amount">{t('Deposit Amount')}</FormLabel>
              <Input id="amount" placeholder="deposit amount" onChange={onChangeAmount} defaultValue={amount} type="number" />
              <FormHelperText>minimum deposit: {minimumDeposit} OCT</FormHelperText>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel htmlFor="email">{t('Email')}</FormLabel>
              <Input id="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} type="text" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="socialLink">{t('Twitter ID')}</FormLabel>
              <Input id="socialMediaHandle" placeholder="your twitter id" 
                onChange={(e) => setSocialMediaHandle(e.target.value)} type="text" />
            </FormControl>
            <HStack>
              <Text>{t('Can be delegated to?')}</Text>
              <Switch onChange={e => setCanBeDelegatedTo(e.target.checked)} defaultChecked={canBeDelegatedTo} />
            </HStack>
            
          </List>
          <Button mt={8} isFullWidth colorScheme="octoColor" type="submit" isLoading={isSubmitting} disabled={
            (!amount || !validatorId) || amount < minimumDeposit || amount > accountBalance || 
            isSubmitting || !email
          } onClick={onSubmit}>
            {
              (!amount || !validatorId) ?
              'Register' :
              (
                amount < minimumDeposit ? 'Minimum Limit' :
                amount > accountBalance ? 'Insufficient Balance' :
                'Register'
              )
              
            }
          </Button>
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}
