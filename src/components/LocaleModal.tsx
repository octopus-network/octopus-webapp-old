import React from 'react';
import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  Button,
  SimpleGrid,
  Box,
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

const LocaleModal = ({ 
  isOpen, 
  onClose 
}: {
  isOpen: boolean;
  onClose: VoidFunction;
}) => {
  const { t, i18n } = useTranslation();
  const i18nResourcesData: any = i18n.services.resourceStore.data || {};

  const setLocale = (locale) => {
    i18n.changeLanguage(locale);
    window.localStorage.setItem('locale', locale);
    onClose();
  } 
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('Language')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid spacing={5} columns={2}>
          {
            Object.keys(i18nResourcesData).map(key => ( 
              <Button key={`locale-btn-${key}`} onClick={() => setLocale(key)} variant={
                i18n.language === key ? 'solid' : 'ghost'
              }>
                {i18nResourcesData[key].translation?.localeName}
              </Button>
            ))
          }
          </SimpleGrid>
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}

export default LocaleModal;