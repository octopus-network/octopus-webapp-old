import React, { useState } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Icon,
  InputGroup,
  Input,
  Button,
  Heading,
  InputRightElement,
  Select,
  Box,
  Flex
} from '@chakra-ui/react';

import {
  AppchainInfo
} from 'types';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';

type DeployModalProps = {
  appchain: AppchainInfo;
  isOpen: boolean;
  onClose: VoidFunction;
}

export const DeployModal: React.FC<DeployModalProps> = ({ appchain, isOpen, onClose }) => {
  const [accessKey, setAccessKey] = useState();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="480px">
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Heading fontSize="xl">
            Choose your cloud vendor and input the access key
          </Heading>
          <Flex borderWidth={1} borderRadius="full" mt={4}>
            <Select maxW="120px" borderWidth={0} borderRadius="full">
              <option value="aws">AWS</option>
            </Select>
            <Input type="text" placeholder="Access Key" borderRadius="full" borderWidth={0} autoFocus />
          </Flex>
          <Box mt={5}>
            <Button 
              isFullWidth 
              borderRadius="full" 
              colorScheme="octoColor" 
              isDisabled={!accessKey}>
              Enter <Icon as={HiOutlineArrowNarrowRight} ml={2} />
            </Button>
          </Box>
          <Box pb={4} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}