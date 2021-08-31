import React, { useEffect, useState } from 'react';
import {
  Container,
  Flex,
  Heading,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Box,
  List,
  Grid,
  GridItem,
  Text,
  useToast
} from '@chakra-ui/react';

import { Formik, Form, Field, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { fromDecimals, toDecimals, BOATLOAD_OF_GAS } from 'utils';
import octopusConfig from 'config/octopus';

const Register = () => {

  const { t } = useTranslation();
  const [minimumRegisterDeposit, setMinimumRegisterDeposit] = useState(0);
  const [accountBalance, setAccountBalance] = useState(0);
  const toast = useToast();

  useEffect(() => {
    window
      .registryContract
      .get_minimum_register_deposit()
      .then(amount => {
        setMinimumRegisterDeposit(fromDecimals(amount, 18));
      });
    window
      .tokenContract
      .ft_balance_of({ account_id: window.accountId })
      .then(amount => {
        setAccountBalance(fromDecimals(amount));
      });
  }, []);

  const validator = () => {

  }

  const onSubmit = (values, actions) => {
    const { appchainId, websiteUrl, githubAddress, githubRelease, commitId, email } = values;
   
    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: octopusConfig.registryContractId,
          amount: toDecimals(minimumRegisterDeposit, 18),
          msg: `register_appchain,${appchainId},${websiteUrl},${githubAddress},${githubRelease},${commitId},${email}`
        },
        BOATLOAD_OF_GAS,
        1,
      ).catch((err) => {
        console.log(err);
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
    <Container maxW="520px" mt="16" mb="16">
      
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
          email: ''
        }}
        onSubmit={onSubmit}
        validate={validator}
      >
        {(props) => (
          
          <Form>
            <List spacing={5}>
              <Grid templateColumns="repeat(5, 1fr)" gap="6">
                <GridItem colSpan={2}>
                  <Field name="appchainId">
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
                        <Input {...field} id="websiteUrl" placeholder="websiteUrl" size="lg" />
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
                    <Input {...field} id="githubAddress" placeholder="githubAddress" size="lg" />
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
                        <Input {...field} id="githubRelease" placeholder="githubRelease" size="lg" />
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
                        <Input {...field} id="commitId" placeholder="commitId" size="lg" />
                        <FormErrorMessage>{form.errors.commitId}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </GridItem>
              </Grid>
              <Grid templateColumns="repeat(5, 1fr)" gap="6">
                <GridItem colSpan={3}>
                  <Field name="email">
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
                        <Text mr="1">Bond:</Text>
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
                {t('Submit')}
              </Button>
            </List>
          </Form>
         
        )}
      </Formik>
      
    </Container>
  );
}

export default Register;