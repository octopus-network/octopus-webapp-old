import React, { useState } from 'react';
import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  ModalFooter,
  Heading,
  Box,
  useToast,
  Button
} from '@chakra-ui/react';

import { ValidatorsTable } from 'components';
import { COMPLEX_CALL_GAS } from 'config/constants';

export const ConfirmBootingModal = ({ 
  isOpen, 
  onClose,
  anchor,
  appchainId,
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  anchor: any;
  appchainId: string;
}) => {
  const toast = useToast();
  
  const [isSubmiting, setIsSubmiting] = useState(false);
  
  const onBooting = () => {
    setIsSubmiting(true);
    anchor
      .go_booting(
        {},
        COMPLEX_CALL_GAS
      )
      .then(() => {
        window.location.reload();
      }).catch(err => {
        setIsSubmiting(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err?.kind?.ExecutionError || err.toString(),
          status: 'error'
        });
      });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Heading fontSize="lg">Are you confirm to booting this appchain?</Heading>
          <Box mt={3}>
            <ValidatorsTable anchor={anchor} noAction={true} appchainId={appchainId} />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button colorScheme="octoColor" ml={3} onClick={onBooting} 
            isLoading={isSubmiting} isDisabled={isSubmiting}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
