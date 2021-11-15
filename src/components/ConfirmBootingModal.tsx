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
import { Gas } from 'primitives';
import { AnchorContract, AppchainId } from 'types';

type ConfirmBootingModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  anchorContract: AnchorContract;
  appchainId: AppchainId;
}

export const ConfirmBootingModal: React.FC<ConfirmBootingModalProps> = ({ 
  isOpen, 
  onClose,
  anchorContract,
  appchainId,
}) => {
  const toast = useToast();
  
  const [isSubmiting, setIsSubmiting] = useState(false);
  
  const onBooting = () => {
    setIsSubmiting(true);
    anchorContract
      .go_booting(
        {},
        Gas.COMPLEX_CALL_GAS
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
            <ValidatorsTable anchorContract={anchorContract} noAction={true} appchainId={appchainId} />
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
