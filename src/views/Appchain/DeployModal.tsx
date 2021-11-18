import React, { BaseSyntheticEvent, useEffect, useState, useMemo } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  List,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Select,
  Button,
  Icon,
  HStack,
  Text,
  Divider,
  Tag,
  useBoolean,
  Box,
  IconButton,
  Flex,
  useToast
} from '@chakra-ui/react';

import {
  AppchainInfo
} from 'types';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { TasksTable } from './TasksTable';
import { deployConfig } from 'config';
import axios from 'axios';
import { RepeatIcon } from '@chakra-ui/icons';

type DeployModalProps = {
  appchain: AppchainInfo;
  isOpen: boolean;
  onClose: VoidFunction;
}

export const DeployModal: React.FC<DeployModalProps> = ({ appchain, isOpen, onClose }) => {
  const [inputAccessKey, setInputAccessKey] = useState();
  const [accessKey, setAccessKey] = useState(window.localStorage.getItem('accessKey'));
  const [cloudVendor] = useState('AWS');
  const toast = useToast();

  const [isDeploying, setIsDeploying] = useBoolean(false);
  const [isInDeploy, setIsInDeploy] = useBoolean(false);
  const [image, setImage] = useState<string>(deployConfig.baseImages[0].image);
  const [refreshFactor, setRefreshFactor] = useState<any>();

  const authKey = useMemo(() => {
    return `appchain-${appchain?.appchainId}-cloud-${cloudVendor}-${accessKey}`;
  }, [appchain, cloudVendor, accessKey]);

  useEffect(() => {
    if (!isOpen) {
      setInputAccessKey(null);
      setIsInDeploy.off();
    }
  }, [isOpen, setIsInDeploy]);

  const onChangeAccessKey = (e: BaseSyntheticEvent) => {
    setInputAccessKey(e.target.value);
  }

  const onNextStep = () => {
    window.localStorage.setItem('accessKey', inputAccessKey);
    setAccessKey(inputAccessKey);
  }

  const onLogout = () => {
    window.localStorage.removeItem('accessKey');
    setInputAccessKey(null);
    setAccessKey(null);
  }

  const onImageChange = (e: BaseSyntheticEvent) => {
    setImage(e.target.value);
  }

  const onRefresh = () => {
    setRefreshFactor(new Date().getTime());
  }

  const onDeploy = () => {
    setIsDeploying.on();
    axios
      .post(`${deployConfig.apiHost}/api/tasks`, {
        cloud_vendor: cloudVendor,
        access_key: accessKey,
        base_image: image,
        chain_spec: deployConfig.baseImages.find(im => im.image === image)?.chain
      }, {
        headers: {
          authorization: authKey
        }
      })
      .then(res => res.data)
      .then(data => {
        setIsInDeploy.off();
        setIsDeploying.off();
        onRefresh();
      })
      .catch(err => {
        setIsDeploying.off();
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={
        !accessKey ?
          '480px' :
          isInDeploy ?
            '460px' :
            'container.md'
      } transition="all .3s ease">
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box maxW="400px">
            {
              !accessKey ?
                <Heading fontSize="xl">
                  Choose your cloud vendor and input the access key
                </Heading> :
                isInDeploy ?
                  <Heading fontSize="xl">
                    Deploy New Validator Node
                  </Heading> :
                  <Heading fontSize="xl">
                    Cloud/{cloudVendor} Tasks
                  </Heading>
            }
          </Box>
          {
            !accessKey ?
              <>
                <Flex borderWidth={1} borderRadius="full" mt={4}>
                  <Select maxW="120px" borderWidth={0} borderRadius="full">
                    <option value="AWS">AWS</option>
                  </Select>
                  <Input type="text" placeholder="Access Key" borderRadius="full" borderWidth={0} autoFocus
                    onChange={e => onChangeAccessKey(e)} />
                </Flex>
                <Box mt={5}>
                  <Button
                    isFullWidth
                    borderRadius="full"
                    colorScheme="octoColor"
                    onClick={onNextStep}
                    isDisabled={!inputAccessKey}>
                    Enter <Icon as={HiOutlineArrowNarrowRight} ml={2} />
                  </Button>
                </Box>
              </> :
              isInDeploy ?
                <List mt={4} spacing={4}>
                  <FormControl>
                    <FormLabel>Cloud Vendor</FormLabel>
                    <Input type="text" defaultValue={cloudVendor} isDisabled />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Access Key</FormLabel>
                    <Input type="text" defaultValue={accessKey} isDisabled />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Base Image</FormLabel>
                    <Select onChange={onImageChange} value={image}>
                      {
                        deployConfig.baseImages.map((image, idx) => (
                          <option value={image.image} key={`option-${idx}`}>{image.label}</option>
                        ))
                      }
                      
                    </Select>
                  </FormControl>
                  <Flex justifyContent="flex-end">
                    <HStack>
                      <Button colorScheme="octoColor" onClick={onDeploy} 
                        isDisabled={isDeploying} isLoading={isDeploying}>Deploy</Button>
                      <Button onClick={setIsInDeploy.off} isDisabled={isDeploying}>Cancel</Button>
                    </HStack>
                  </Flex>
                </List> :
                <>
                  <Flex mt={4} justifyContent="space-between" alignItems="center">
                    <HStack>
                      <Text color="gray" fontSize="sm">Access Key</Text>
                      <Tag>{accessKey}</Tag>
                    </HStack>
                    <HStack>
                      <IconButton aria-label="refresh" size="sm" variant="ghost" onClick={onRefresh}>
                        <RepeatIcon />
                      </IconButton>
                      <Button size="sm" colorScheme="octoColor" onClick={setIsInDeploy.on}>Deploy New</Button>
                      <Button size="sm" onClick={onLogout}>Logout</Button>
                    </HStack>
                  </Flex>
                  <Divider mt={3} mb={3} />
                  <Box>
                    <TasksTable authKey={authKey} refreshFactor={refreshFactor} />
                  </Box>
                </>
          }

          <Box pb={6} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}