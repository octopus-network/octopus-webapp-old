import React from 'react';

import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  Flex,
  Image,
  Text,
  List,
  Box,
  VStack,
  Heading
} from '@chakra-ui/react';

type SelectTokenModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  tokens: any[];
  onChoose: Function;
}

export const SelectTokenModal: React.FC<SelectTokenModalProps> = ({ isOpen, onClose, tokens, onChoose }) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Token</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <List>
            {
              tokens?.map((token, idx) => (
                <Flex p={3} key={`token-${idx}`} alignItems="center" borderRadius="xl" cursor="pointer" _hover={{
                  background: 'blackAlpha.100'
                }} onClick={() => onChoose(token)}>
                  <Box boxSize={6} borderRadius="full">
                    <Image src={token.logoUri} width="100%" height="100%" />
                  </Box>
                  <Heading fontSize="md" ml={2}>{token.symbol}</Heading>
                </Flex>
              ))
            }
          </List>
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}