import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalOverlay, 
  ModalHeader, 
  ModalCloseButton, 
  ModalFooter,
  Heading,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputRightElement,
  List,
  useToast,
  Button
} from '@chakra-ui/react';

import { COMPLEX_CALL_GAS } from 'config/constants';

type GoLiveModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  anchor: any;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({ 
  isOpen, 
  onClose,
  anchor
}) => {
  const toast = useToast();
  
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [isUpdatingRPCEndpoint, setIsUpdatingRPCEndpoint] = useState(false);
  const [isUpdatingSubqlEndpoint, setIsUpdatingSubqlEndpoint] = useState(false);
  const [isUpdatingEraRewards, setIsUpdatingEraRewards] = useState(false);
  const [rpcEndpoint, setRPCEndpoint] = useState('');
  const [subqlEndpoint, setSubqlEndpoint] = useState('');
  const [eraRewards, setEraRewards] = useState('');

  const [inputRPCEndpoint, setInputRPCEndpoint] = useState('');
  const [inputSubqlEndpoint, setInputSubqlEndpoint] = useState('');
  const [inputEraRewards, setInputEraRewards] = useState('');

  useEffect(() => {
    if (!anchor) return;

    anchor
      .get_appchain_settings()
      .then(({ rpc_endpoint, subql_endpoint, era_reward }) => {

        setRPCEndpoint(rpc_endpoint);
        setSubqlEndpoint(subql_endpoint);
        setEraRewards(era_reward);
      });
  }, [anchor]);
  
  const onSetRPCEndpoint = () => {
    setIsUpdatingRPCEndpoint(true);
    anchor
      .set_rpc_endpoint(
        { rpc_endpoint: inputRPCEndpoint },
        COMPLEX_CALL_GAS
      )
      .then(() => {
        window.location.reload();
      }).catch(err => {
        setIsUpdatingRPCEndpoint(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err?.kind?.ExecutionError || err.toString(),
          status: 'error'
        });
      });
  }

  const onSetSubqlEndpoint = () => {
    setIsUpdatingSubqlEndpoint(true);
    anchor
      .set_subql_endpoint(
        { subql_endpoint: inputSubqlEndpoint },
        COMPLEX_CALL_GAS
      )
      .then(() => {
        window.location.reload();
      }).catch(err => {
        setIsUpdatingSubqlEndpoint(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err?.kind?.ExecutionError || err.toString(),
          status: 'error'
        });
      });
  }

  const onSetEraRewards = () => {
    setIsUpdatingEraRewards(true);
    anchor
      .set_era_reward(
        { era_reward: inputEraRewards },
        COMPLEX_CALL_GAS
      )
      .then(() => {
        window.location.reload();
      }).catch(err => {
        setIsUpdatingEraRewards(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err?.kind?.ExecutionError || err.toString(),
          status: 'error'
        });
      });
  }

  const onGoLive = () => {
    setIsSubmiting(true);
    anchor
      .go_live(
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
          <Heading fontSize="lg">Are you confirm to active this appchain?</Heading>
          <List mt={3} spacing={4}>
            <FormControl isRequired>
              <FormLabel>RPC Endpoint</FormLabel>
              <InputGroup>
                <Input type="text" placeholder="rpc endpoint" defaultValue={rpcEndpoint} onChange={e => setInputRPCEndpoint(e.target.value)} />
                <InputRightElement w="auto" mr={1}>
                  <Button size="sm" isLoading={isUpdatingRPCEndpoint} onClick={onSetRPCEndpoint}
                    isDisabled={isUpdatingRPCEndpoint}>Update</Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Subql Endpoint</FormLabel>
              <InputGroup>
                <Input type="text" placeholder="rpc endpoint" defaultValue={subqlEndpoint} onChange={e => setInputSubqlEndpoint(e.target.value)} />
                <InputRightElement w="auto" mr={1}>
                  <Button size="sm" isLoading={isUpdatingSubqlEndpoint} onClick={onSetSubqlEndpoint}
                    isDisabled={isUpdatingSubqlEndpoint}>Update</Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Era Rewards</FormLabel>
              <InputGroup>
                <Input type="number" placeholder="era rewards" defaultValue={eraRewards} onChange={e => setInputEraRewards(e.target.value)} />
                <InputRightElement w="auto" mr={1}>
                  <Button size="sm" isLoading={isUpdatingEraRewards} onClick={onSetEraRewards}
                    isDisabled={isUpdatingEraRewards}>Update</Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </List>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button colorScheme="octoColor" ml={3} 
            onClick={onGoLive} 
            isLoading={isSubmiting} 
            isDisabled={isSubmiting || !rpcEndpoint || !subqlEndpoint || (eraRewards as any * 1) <= 0}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
