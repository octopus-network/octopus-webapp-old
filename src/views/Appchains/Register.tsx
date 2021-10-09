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
  InputRightElement,
  FormErrorMessage,
  Box,
  List,
  Grid,
  GridItem,
  Text,
  useToast
} from '@chakra-ui/react';

import { Formik, Form, Field } from 'formik';
import { useTranslation } from 'react-i18next';
import { fromDecimals, toDecimals } from 'utils';
import { FAILED_TO_REDIRECT_MESSAGE, COMPLEX_CALL_GAS } from 'config/constants';
import octopusConfig from 'config/octopus';

const Register = () => {

  const { t } = useTranslation();
  const [minimumRegisterDeposit, setMinimumRegisterDeposit] = useState(0);
  const [accountBalance, setAccountBalance] = useState(0);
  const toast = useToast();

  useEffect(() => {
    window
      .registryContract
      .get_registry_settings()
      .then(({ minimum_register_deposit }) => {
        setMinimumRegisterDeposit(fromDecimals(minimum_register_deposit, 18));
      });
    
    if (window.accountId) {
      window
        .tokenContract
        .ft_balance_of({ account_id: window.accountId })
        .then(amount => {
          setAccountBalance(fromDecimals(amount));
        });
    }
    
  }, []);

  const validateAppchainId = (value) => {
    const reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (!reg.test(value)) {
      return 'Consists of [a-z|0-9] or `-`';
    }
  }

  const validateEmail = (value) => {
    const reg = /^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,15})$/;
    if (!reg.test(value)) {
      return 'Invalid email';
    }
  }

  const onSubmit = (values, actions) => {
   
    const { 
      appchainId, websiteUrl, githubAddress, githubRelease, commitId, email,
      preminedAmount, idoAmount, eraReward
    } = values;

    if (accountBalance < minimumRegisterDeposit) {
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

    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: octopusConfig.registryContractId,
          amount: toDecimals(minimumRegisterDeposit),
          msg: JSON.stringify({
            "RegisterAppchain": {
              "appchain_id": appchainId,
              "website_url": websiteUrl, 
              "github_address": githubAddress, 
              "github_release": githubRelease,
              "commit_id": commitId,
              "contact_email": email,
              "premined_wrapped_appchain_token": preminedAmount.toString(),
              "ido_amount_of_wrapped_appchain_token": idoAmount.toString(),
              "initial_era_reward": eraReward.toString(),
              "custom_metadata": {}
            }
          })
        },
        COMPLEX_CALL_GAS,
        1,
      ).catch((err) => {
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
    <Container maxW="640px" mt="16" mb="16">
      
      <Box pb="10">
        <Heading fontSize={{ base: '3xl', md: '4xl' }}>{t('Join Octopus Network')}</Heading>
      </Box>
      <Formik
        initialValues={{ 
          appchainId: '',
          websiteUrl: '',
          githubAddress: '',
          githubRelease: '',
          commitId: '',
          email: '',
          preminedAmount: 0,
          idoAmount: 0,
          eraReward: ''
        }}
        onSubmit={onSubmit}
      >
        {(props) => (
          
          <Form>
            <List spacing={5}>
              <Grid templateColumns="repeat(5, 1fr)" gap="6">
                <GridItem colSpan={2}>
                  <Field name="appchainId" validate={validateAppchainId}>
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.appchainId && form.touched.appchainId} isRequired>
                        <FormLabel htmlFor="appchainId">{t('Appchain ID')}</FormLabel>
                        <Input {...field} id="appchainId" placeholder="appchainId" size="lg" autoFocus />
                        <FormErrorMessage>{form.errors.appchainId}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
                <GridItem colSpan={3}>
                  <Field name="websiteUrl">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.websiteUrl && form.touched.websiteUrl}>
                        <FormLabel htmlFor="websiteUrl">{t('Website')}</FormLabel>
                        <Input {...field} id="websiteUrl" placeholder="Website Url" size="lg" />
                        <FormErrorMessage>{form.errors.websiteUrl}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
              </Grid>
              <Field name="githubAddress">
                {({ field, form }) => (
                  <FormControl isInvalid={form.errors.githubAddress && form.touched.githubAddress} isRequired>
                    <FormLabel htmlFor="githubAddress">{t('Github Address')}</FormLabel>
                    <Input {...field} id="githubAddress" placeholder="eg. https://github.com/octopus-network/barnacle" size="lg" />
                    <FormErrorMessage>{form.errors.githubAddress}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Grid templateColumns="repeat(5, 1fr)" gap="6">
                <GridItem colSpan={3}>
                  <Field name="githubRelease">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.githubRelease && form.touched.githubRelease} isRequired>
                        <FormLabel htmlFor="githubRelease">{t('Github Release')}</FormLabel>
                        <Input {...field} id="githubRelease" placeholder="eg. https://github.com/octopus-network/barnacle/releases/tag/v0.2-alpha.1" size="lg" />
                        <FormErrorMessage>{form.errors.githubRelease}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="commitId">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.commitId && form.touched.commitId} isRequired>
                        <FormLabel htmlFor="commitId">{t('Commit ID')}</FormLabel>
                        <Input {...field} id="commitId" placeholder="eg. a49ca413ab9862149676d9579333e24c64613e3a" size="lg" />
                        <FormErrorMessage>{form.errors.commitId}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
              </Grid>
              <Grid templateColumns="repeat(6, 1fr)" gap="6">
                <GridItem colSpan={2}>
                  <Field name="preminedAmount">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.preminedAmount && form.touched.preminedAmount} isRequired>
                        <FormLabel htmlFor="preminedAmount">{t('Premined Amount')}</FormLabel>
                        <InputGroup size="lg">
                          <Input {...field} id="preminedAmount" placeholder="premined amount" />
                          {/* <InputRightElement children={<Text fontSize="sm" color="black">OCT</Text>} /> */}
                        </InputGroup>
                        <FormErrorMessage>{form.errors.preminedAmount}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="idoAmount">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.idoAmount && form.touched.idoAmount} isRequired>
                        <FormLabel htmlFor="idoAmount">{t('IDO Amount')}</FormLabel>
                        <InputGroup size="lg">
                          <Input {...field} id="idoAmount" placeholder="ido amount" />
                          {/* <InputRightElement children={<Text fontSize="sm" color="black">OCT</Text>} /> */}
                        </InputGroup>
                        <FormErrorMessage>{form.errors.idoAmount}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="eraReward">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.eraReward && form.touched.eraReward} isRequired>
                        <FormLabel htmlFor="eraReward">{t('Era Reward')}</FormLabel>
                        <Input {...field} id="eraReward" placeholder="initial era reward" size="lg" />
                        <FormErrorMessage>{form.errors.eraReward}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
              </Grid>
              <Grid templateColumns="repeat(5, 1fr)" gap="6">
                <GridItem colSpan={3}>
                  <Field name="email" validate={validateEmail}>
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.email && form.touched.email} isRequired>
                        <FormLabel htmlFor="email">{t('Email')}</FormLabel>
                        <Input {...field} id="email" placeholder="email" size="lg" />
                        <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel htmlFor="email">&nbsp;</FormLabel>
                    <VStack alignItems="flex-start" spacing="0">
                      <Flex alignItems="center">
                        <Text mr="1" fontSize="sm">Auditing Fee:</Text>
                        <Heading fontSize="md">{minimumRegisterDeposit} OCT</Heading>
                      </Flex>
                      <Text color="gray" fontSize="xs">Balance: {accountBalance} OCT</Text>
                    </VStack>
                  </FormControl>
                </GridItem>
              </Grid>
              <Button
                mt={4}
                colorScheme="octoColor"
                isLoading={props.isSubmitting}
                disabled={props.isSubmitting || !window.accountId}
                type="submit"
                size="lg"
                isFullWidth={true}
              >
                { window?.accountId ? t('Submit') : t('Please Login') }
              </Button>
            </List>
          </Form>
        )}
      </Formik>
      
    </Container>
  );
}

export default Register;