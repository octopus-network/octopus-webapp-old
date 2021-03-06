import React, { useEffect, useState } from 'react';

import {
  Container,
  Flex,
  Heading,
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  FormErrorMessage,
  Box,
  List,
  Grid,
  GridItem,
  Text,
  useToast,
  HStack,
  useBoolean,
  Image,
  Icon
} from '@chakra-ui/react';

import { Formik, Form, Field } from 'formik';
import { useTranslation } from 'react-i18next';
import { EditIcon } from '@chakra-ui/icons';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { FAILED_TO_REDIRECT_MESSAGE, Gas, OCT_TOKEN_DECIMALS } from 'primitives';
import { octopusConfig } from 'config';
import { TokenInfoModal } from 'components';
import Decimal from 'decimal.js';

import { useGlobalStore } from 'stores';

export const Register: React.FC = () => {

  const { t } = useTranslation();
  const [minimumRegisterDeposit, setMinimumRegisterDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [tokenInfo, setTokenInfo] = useState<any>();
  const [tokenInfoModalOpen, setTokenInfoModalOpen] = useBoolean(false);
  const [accountBalance, setAccountBalance] = useState(ZERO_DECIMAL);
  const toast = useToast();
  const globalStore = useGlobalStore(state => state.globalStore);

  useEffect(() => {
    globalStore
      .registryContract
      .get_registry_settings()
      .then(({ minimum_register_deposit }) => {
        setMinimumRegisterDeposit(
          DecimalUtils.fromString(minimum_register_deposit, OCT_TOKEN_DECIMALS)
        );
      });

    if (globalStore.accountId) {
      globalStore
        .tokenContract
        .ft_balance_of({ account_id: globalStore.accountId })
        .then(amount => {
          setAccountBalance(
            DecimalUtils.fromString(amount, OCT_TOKEN_DECIMALS)
          );
        });
    }

  }, [globalStore]);

  const validateAppchainId = (value) => {
    const reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (!reg.test(value)) {
      return 'Consists of [a-z|0-9] or `-`';
    }
  }

  const validateEmail = (value) => {
    const reg = /^([a-zA-Z]|[0-9])(\w)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,15})$/;
    if (!reg.test(value)) {
      return 'Invalid email';
    }
  }

  const onSubmit = (values, actions) => {

    const {
      appchainId, websiteUrl, githubAddress, githubRelease, email,
      preminedAmount, idoAmount, eraReward, preminedBeneficiary, functionSpecUrl
    } = values;

    if (!tokenInfo?.name || !tokenInfo.symbol) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Please input the token info',
        status: 'error'
      });
      setTimeout(() => {
        actions.setSubmitting(false);
      }, 300);
      return;
    }

    if (accountBalance.lt(minimumRegisterDeposit)) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Insufficient OCT Balance',
        status: 'error'
      });
      setTimeout(() => {
        actions.setSubmitting(false);
      }, 300);
      return;
    }

    if (isNaN(preminedAmount) || isNaN(idoAmount) || isNaN(eraReward)) {
      toast({
        position: 'top-right',
        title: 'Error',
        description: 'Premined/IDO amount or Era Reward must be numeric',
        status: 'error'
      });
      setTimeout(() => {
        actions.setSubmitting(false);
      }, 300);
      return;
    }

    globalStore
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: octopusConfig.registryContractId,
          amount: DecimalUtils.toU64(minimumRegisterDeposit, OCT_TOKEN_DECIMALS).toString(),
          msg: JSON.stringify({
            "RegisterAppchain": {
              "appchain_id": appchainId,
              "website_url": websiteUrl,
              "github_address": githubAddress,
              "github_release": githubRelease,
              "contact_email": email,
              "function_spec_url": functionSpecUrl,
              "premined_wrapped_appchain_token_beneficiary": preminedBeneficiary,
              "premined_wrapped_appchain_token": preminedAmount.toString(),
              "ido_amount_of_wrapped_appchain_token": idoAmount.toString(),
              "initial_era_reward": eraReward.toString(),
              "fungible_token_metadata": {
                "spec": "ft-1.0.0",
                "name": tokenInfo.name,
                "symbol": tokenInfo.symbol,
                "icon": tokenInfo.icon,
                "reference": null,
                "reference_hash": null,
                "decimals": tokenInfo.decimals * 1
              },
              "custom_metadata": {}
            }
          })
        },
        Gas.COMPLEX_CALL_GAS,
        1,
      ).catch((err) => {
        console.log(err);
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        actions.setSubmitting(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  return (
    <>
      <Container maxW="container.md" mt={14} mb={16}>
        <Box pb={10}>
          <Heading fontSize={{ base: '3xl', md: '4xl' }}>{t('Join Octopus Network')}</Heading>
        </Box>
       
        <Formik
          initialValues={{
            appchainId: '',
            websiteUrl: '',
            githubAddress: '',
            githubRelease: '',
            email: '',
            preminedAmount: 0,
            preminedBeneficiary: '',
            idoAmount: 0,
            eraReward: ''
          }}
          onSubmit={onSubmit}
        >
          {(props) => (

            <Form>
              <Box p={8} bg="white" boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px" borderRadius="xl">
              <List spacing={4}>
                <Grid templateColumns="repeat(5, 1fr)" gap="6">
                  <GridItem colSpan={2}>
                    <Field name="appchainId" validate={validateAppchainId}>
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.appchainId && form.touched.appchainId} isRequired>
                          <FormLabel htmlFor="appchainId">{t('Appchain ID')}</FormLabel>
                          <Input {...field} id="appchainId" placeholder="appchainId" autoFocus />
                          <FormErrorMessage>{form.errors.appchainId}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                    <FormControl isRequired>
                      <FormLabel>{t('Token Info')}</FormLabel>
                      <Flex alignItems="center">
                        <HStack>
                          <Box bg="#eee" w={10} h={10} borderRadius="30px" overflow="hidden">
                            {
                              tokenInfo?.icon ?
                                <Image src={tokenInfo.icon} /> : null
                            }
                          </Box>
                          <VStack alignItems="flex-start" spacing={0}>
                            <Heading fontSize="sm" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                              {tokenInfo?.symbol || 'Token Symbol'}
                            </Heading>
                            <Text fontSize="xs" whiteSpace="nowrap" overflow="hidden" color="gray" textOverflow="ellipsis">
                              {tokenInfo?.name || 'Token Name'}
                            </Text>
                          </VStack>
                        </HStack>
                        <Button onClick={setTokenInfoModalOpen.on} size="sm" ml={2}>
                          <EditIcon mr={1} /> Edit
                        </Button>
                      </Flex>
                    </FormControl>
                  </GridItem>
                </Grid>
                <Grid templateColumns="repeat(6, 1fr)" gap="6">
                  <GridItem colSpan={3}>
                    <Field name="websiteUrl">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.websiteUrl && form.touched.websiteUrl} isRequired>
                          <FormLabel htmlFor="websiteUrl">{t('Website')}</FormLabel>
                          <Input {...field} id="websiteUrl" placeholder="Website Url" />
                          <FormErrorMessage>{form.errors.websiteUrl}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                    <Field name="functionSpecUrl">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.functionSpecUrl && form.touched.functionSpecUrl} isRequired>
                          <FormLabel htmlFor="functionSpecUrl">{t('Function Spec')}</FormLabel>
                          <Input {...field} id="githubRelease" placeholder="function spec url" />
                          <FormErrorMessage>{form.errors.functionSpecUrl}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
                <Grid templateColumns="repeat(6, 1fr)" gap="6">
                  <GridItem colSpan={3}>
                    <Field name="githubAddress">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.githubAddress && form.touched.githubAddress} isRequired>
                          <FormLabel htmlFor="githubAddress">{t('Github Address')}</FormLabel>
                          <Input {...field} id="githubAddress" placeholder="eg. https://github.com/octopus-network/barnacle" />
                          <FormErrorMessage>{form.errors.githubAddress}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                    <Field name="githubRelease">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.githubRelease && form.touched.githubRelease} isRequired>
                          <FormLabel htmlFor="githubRelease">{t('Github Release')}</FormLabel>
                          <Input {...field} id="githubRelease" placeholder="eg. https://github.com/octopus-network/barnacle/releases/tag/v0.2-alpha.1" />
                          <FormErrorMessage>{form.errors.githubRelease}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>

                <Grid templateColumns="repeat(5, 1fr)" gap={6}>
                  <GridItem colSpan={2}>
                    <Field name="preminedAmount">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.preminedAmount && form.touched.preminedAmount} isRequired>
                          <FormLabel htmlFor="preminedAmount">{t('Premined Amount')}</FormLabel>
                          <InputGroup>
                            <Input {...field} id="preminedAmount" placeholder="premined amount" onFocus={e => e.target.select()} />
                          </InputGroup>
                          <FormErrorMessage>{form.errors.preminedAmount}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                    <Field name="preminedBeneficiary">
                      {({ field, form }) => {
                        return form.values.preminedAmount > 0 ? (
                          <FormControl isInvalid={form.errors.preminedAmount && form.touched.preminedAmount} isRequired>
                            <FormLabel htmlFor="preminedBeneficiary">{t('Beneficiary')}</FormLabel>
                            <InputGroup>
                              <Input {...field} id="preminedBeneficiary" placeholder="premined token beneficiary" />
                            </InputGroup>
                            <FormErrorMessage>{form.errors.preminedBeneficiary}</FormErrorMessage>
                          </FormControl>
                        ) : null;
                      }}
                    </Field>
                  </GridItem>
                </Grid>
                <Grid templateColumns="repeat(5, 1fr)" gap={6}>
                  <GridItem colSpan={2}>
                    <Field name="idoAmount">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.idoAmount && form.touched.idoAmount} isRequired>
                          <FormLabel htmlFor="idoAmount">{t('IDO Amount')}</FormLabel>
                          <InputGroup>
                            <Input {...field} id="idoAmount" placeholder="ido amount" onFocus={e => e.target.select()} />
                          </InputGroup>
                          <FormErrorMessage>{form.errors.idoAmount}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                    <Field name="eraReward">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.eraReward && form.touched.eraReward} isRequired>
                          <FormLabel htmlFor="eraReward">{t('Era Reward')}</FormLabel>
                          <Input {...field} id="eraReward" placeholder="initial era reward" />
                          <FormErrorMessage>{form.errors.eraReward}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                </Grid>
                <Grid templateColumns="repeat(5, 1fr)" gap="6">
                  <GridItem colSpan={2}>
                    <Field name="email" validate={validateEmail}>
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.email && form.touched.email} isRequired>
                          <FormLabel htmlFor="email">{t('Email')}</FormLabel>
                          <Input {...field} id="email" placeholder="email" />
                          <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </GridItem>
                  <GridItem colSpan={3}>
                   
                  </GridItem>
                </Grid>

              </List>
              </Box>
              <Flex justifyContent="space-between" alignItems="center" mt={8}>
                <VStack alignItems="flex-start">
                  <Flex alignItems="center">
                    <Text mr="1" fontSize="sm">Auditing Fee:</Text>
                    <Heading fontSize="md">
                      { DecimalUtils.beautify(minimumRegisterDeposit) } OCT
                    </Heading>
                  </Flex>
                  <Text color="gray" fontSize="xs">
                    Balance: { DecimalUtils.beautify(accountBalance) } OCT
                  </Text>
                </VStack>
                <Button
                  
                  colorScheme="octoColor"
                  isLoading={props.isSubmitting}
                  disabled={props.isSubmitting || !globalStore.accountId}
                  type="submit"
                  size="lg"
                >
                  {globalStore?.accountId ? t('Submit') : t('Please Login')}
                  <Icon as={HiOutlineArrowNarrowRight} ml={2} />
                </Button>
              </Flex>
            </Form>
          )}
        </Formik>
       
      </Container>
      <TokenInfoModal isOpen={tokenInfoModalOpen} onClose={setTokenInfoModalOpen.off}
        tokenInfo={tokenInfo} onUpdate={(info) => {
          setTokenInfo(info);
          setTokenInfoModalOpen.off();
        }} />
    </>
  );
}
