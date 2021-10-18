import React from 'react';
import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Box,
  List,
  Button
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';
import { Formik, Form, Field } from 'formik';

const TokenInfoModal = ({ 
  isOpen, 
  onClose,
  tokenInfo,
  onUpdate
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  tokenInfo: any;
  onUpdate: Function;
}) => {
  const { t, i18n } = useTranslation();
  const onSubmit = (values) => {
    onUpdate(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Formik
            initialValues={{
              name: tokenInfo?.name || '',
              symbol: tokenInfo?.symbol || '',
              icon: tokenInfo?.icon || '',
              decimals: tokenInfo?.decimals || 18
            }}
            onSubmit={onSubmit}
          >
            {(props) => (
              <Form>
                <List spacing={4}>
                  <Field name="name">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.name && form.touched.name} isRequired>
                        <FormLabel htmlFor="name">{t('Token Name')}</FormLabel>
                        <Input {...field} id="name" placeholder="token name" autoFocus />
                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="symbol">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.symbol && form.touched.symbol} isRequired>
                        <FormLabel htmlFor="symbol">{t('Token Symbol')}</FormLabel>
                        <Input {...field} id="tokenSymbol" placeholder="token symbol" />
                        <FormErrorMessage>{form.errors.tokenSymbol}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="icon">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.icon && form.touched.icon} isRequired>
                        <FormLabel htmlFor="icon">{t('Icon')}</FormLabel>
                        <Input {...field} id="icon" placeholder="icon url" />
                        <FormErrorMessage>{form.errors.icon}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="decimals">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.decimals && form.touched.decimals} isRequired>
                        <FormLabel htmlFor="decimals">{t('Decimals')}</FormLabel>
                        <Input {...field} id="decimals" placeholder="decimals" />
                        <FormErrorMessage>{form.errors.decimals}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </List>
                <Button mt={8} isFullWidth colorScheme="octoColor" type="submit">Confirm</Button>
              </Form>
            )}
          </Formik>
          
          
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}

export default TokenInfoModal;