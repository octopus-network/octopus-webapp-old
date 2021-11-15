import React from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody
} from '@chakra-ui/react';

import {
  AppchainInfo
} from 'types';

type DeployModalProps = {
  appchain: AppchainInfo;
  isOpen: boolean;
  onClose: VoidFunction;
}

export const DeployModal: React.FC<DeployModalProps> = ({ appchain, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Deoply Tool
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          Deploy Modal
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}