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

import { AnchorContract } from 'types';

import { base58Decode } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { useTranslation } from 'react-i18next';
import { FAILED_TO_REDIRECT_MESSAGE, Gas, OCT_TOKEN_DECIMALS } from 'primitives';
import { useGlobalStore } from 'stores';

import Decimal from 'decimal.js';
import { ZERO_DECIMAL, DecimalUtils } from 'utils';

type RegisterValidatorModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  anchorContract: AnchorContract;
}

export const RegisterValidatorModal: React.FC<RegisterValidatorModalProps> = ({ 
  isOpen, 
  onClose,
  anchorContract
}) => {
  const toast = useToast();
  const { t } = useTranslation();

  const globalStore = useGlobalStore(state => state.globalStore);
  const [amount, setAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [validatorId, setValidatorId] = useState<any>('');
  const [canBeDelegatedTo, setCanBeDelegatedTo] = useState(false);
  const [minimumDeposit, setMinimumDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [accountBalance, setAccountBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialMediaHandle, setSocialMediaHandle] = useState('');
  const [email, setEmail] = useState('');

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
    ]).then(([{ minimum_validator_deposit }, balance]) => {
      setMinimumDeposit(DecimalUtils.fromString(minimum_validator_deposit, OCT_TOKEN_DECIMALS));
      setAccountBalance(DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS));
      setAmount(DecimalUtils.fromString(minimum_validator_deposit, OCT_TOKEN_DECIMALS));
    });
    
  }, [anchorContract, globalStore]);

  const onChangeAmount = ({ target: { value } }) => {
    setAmount(DecimalUtils.fromString(value));
  }

  const onChangeValidatorId = ({ target: { value } }) => {
    setValidatorId(value);
  }

  const onSubmit = () => {
    
    let hexId = '';
    try {
      const u8a = base58Decode(validatorId);
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

    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchorContract.contractId,
          amount: DecimalUtils.toU64(amount, OCT_TOKEN_DECIMALS).toString(),
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
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
              <Input id="amount" placeholder="deposit amount" onChange={onChangeAmount} 
                defaultValue={amount.toNumber() || ''} type="number" />
              <FormHelperText>
                minimum deposit: { DecimalUtils.beautify(minimumDeposit) } OCT
              </FormHelperText>
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
           !validatorId || amount.lt(minimumDeposit) || amount.gt(accountBalance) || 
            isSubmitting || !email
          } onClick={onSubmit}>
            {
              (!amount || !validatorId) ?
              'Register' :
              (
                amount.lt(minimumDeposit) ? 'Minimum Limit' :
                amount.gt(accountBalance) ? 'Insufficient Balance' :
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
