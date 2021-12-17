import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  Select,
  Flex,
  HStack,
  Button,
  useBoolean,
  useToast,
  Box,
  Icon
} from '@chakra-ui/react';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { deployConfig, octopusConfig } from 'config';
import { getAuthKey } from 'utils';
import { AppchainInfo } from 'types';

type DeployModalProps = {
  appchain: AppchainInfo;
  isOpen: boolean;
  onClose: VoidFunction;
  onDeployed: VoidFunction;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  onDeployed,
  appchain
}) => {

  const toast = useToast();

  const [step, setStep] = useState(1);
  const [inputAccessKey, setInputAccessKey] = useState('');
  const [cloudVendor, setCloudVendor] = useState('AWS');
  const [region, setRegion] = useState('');
  const [isDeploying, setIsDeploying] = useBoolean(false);
  const [isLoading, setIsLoading] = useBoolean(false);

  useEffect(() => {
    setInputAccessKey(window.localStorage.getItem('accessKey') || '');
    setStep(1);
  }, [isOpen]);

  const image = useMemo(() => deployConfig.baseImages[appchain?.appchainId] || deployConfig.baseImages.default, [appchain]);

  const authKey = useMemo(() => {
    if (!appchain || !inputAccessKey) return '';
    return getAuthKey(appchain?.appchainId, octopusConfig.networkId, cloudVendor, inputAccessKey);
  }, [appchain, cloudVendor, inputAccessKey]);

  const onDeploy = () => {
    setIsDeploying.on();
    axios
      .post(`${deployConfig.apiHost}/api/tasks`, {
        cloud_vendor: cloudVendor,
        access_key: inputAccessKey,
        base_image: image.image,
        region,
        chain_spec:
          octopusConfig.networkId === 'mainnet' ? 'octopus-mainnet' :
            image.chain ||
            `octopus-${octopusConfig.networkId}`
      }, {
        headers: {
          authorization: authKey
        }
      })
      .then(res => res.data)
      .then(data => {
        onDeployed();
        setIsDeploying.off();
        onClose();
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

  const onNextStep = useCallback(() => {
    window.localStorage.setItem('accessKey', inputAccessKey);
    setIsLoading.on();
    axios
      .get(`${deployConfig.apiHost}/api/tasks`, {
        headers: {
          authorization: authKey
        }
      })
      .then(res => res.data)
      .then(data => {
        setIsLoading.off();
        if (data.length) {
          window.location.reload();
        } else {
          setStep(2);
        }
      });
  }, [authKey, inputAccessKey]);

  const onChangeCloudVendor = (e) => {
    setCloudVendor(e.target.value);
    setInputAccessKey('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Deploy Node</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {
            step === 1 ?
              <>
                <Flex borderWidth={1} borderRadius="full" mt={4}>
                  <Select maxW="150px" borderWidth={0} borderRadius="full" value={cloudVendor} 
                    onChange={onChangeCloudVendor}>
                    <option value="AWS">AWS (Amazon Web Services)</option>
                    <option value="GCP" disabled>GCP (Google Cloud Platform)</option>
                  </Select>
                  <Input type="text" placeholder="Access Key" value={inputAccessKey} borderRadius="full" borderWidth={0} autoFocus
                    onChange={e => setInputAccessKey(e.target.value)} />
                </Flex>
                <Box mt={5}>
                  <Button
                    isFullWidth
                    borderRadius="full"
                    colorScheme="octoColor"
                    isLoading={isLoading}
                    onClick={onNextStep}
                    isDisabled={!inputAccessKey || isLoading}>
                    Enter <Icon as={HiOutlineArrowNarrowRight} ml={2} />
                  </Button>
                </Box>
              </> :
              <List spacing={4}>
                <FormControl>
                  <FormLabel>Cloud Vendor</FormLabel>
                  <Input type="text" value={cloudVendor} isDisabled />
                </FormControl>
                <FormControl>
                  <FormLabel>Access Key</FormLabel>
                  <Input type="text" value={inputAccessKey} isDisabled />
                </FormControl>
                <FormControl>
                <FormLabel>Region</FormLabel>
                  <Select onChange={e => setRegion(e.target.value)}>
                    {
                      deployConfig.regions.map((region, idx) => (
                        <option value={region.value} key={`option-${idx}`}>{region.label}</option>
                      ))
                    }
                  </Select>
                </FormControl>
                <Flex justifyContent="flex-end">
                  <HStack>
                    <Button colorScheme="octoColor" onClick={onDeploy}
                      isDisabled={isDeploying} isLoading={isDeploying}>Deploy</Button>
                    <Button onClick={onClose} isDisabled={isDeploying}>Cancel</Button>
                  </HStack>
                </Flex>
              </List>
          }

        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}