import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';

import {
  Flex,
  Heading,
  Button,
  Divider,
  useBoolean,
  SimpleGrid,
  GridItem,
  Skeleton,
  HStack,
  Icon,
  Box,
  IconButton
} from '@chakra-ui/react';

import { 
  AppchainInfo,
  Task,
  OriginTask,
  TaskState
} from 'types';

import { ApiPromise } from '@polkadot/api';
import { RiKey2Fill } from 'react-icons/ri';
import { RepeatIcon } from '@chakra-ui/icons';
import { AiOutlineCloudServer } from 'react-icons/ai';
import { getAuthKey } from 'utils';
import { deployConfig, octopusConfig } from 'config';
import { TaskRow } from './TaskRow';
import { DeployModal } from './DeployModal';
import { SetSessionKeyModal } from './SetSessionKeyModal';

type NodePanelProps = {
  apiPromise: ApiPromise;
  appchain: AppchainInfo;
}

const statesRecord: Record<string, TaskState> = {
  '0': { label: 'init', color: 'blue', state: 0 },
  '10': { label: 'applying', color: 'teal', state: 10 },
  '11': { label: 'apply failed', color: 'red', state: 11 },
  '12': { label: 'running', color: 'green', state: 12 },
  '20': { label: 'destroying', color: 'teal', state: 20 },
  '21': { label: 'destroy failed', color: 'orange', state: 21 },
  '22': { label: 'destroyed', color: 'gray', state: 22 }
}

export const NodePanel: React.FC<NodePanelProps> = ({ appchain, apiPromise }) => {
  const [accessKey, setAccessKey] = useState(window.localStorage.getItem('accessKey') || '');
  const [cloudVendor] = useState('AWS');
  const [isRefreshing, setIsRefreshing] = useBoolean(true);
  const [deployModalOpen, setDeployModalOpen] = useBoolean(false);
  
  const [setSessionKeyModalOpen, setSetSessionKeyModalOpen] = useBoolean(false);
  const [myTask, setMyTask] = useState<Task>();
  
  const authKey = useMemo(() => {
    if (!appchain || !accessKey) return '';
    return getAuthKey(appchain?.appchainId, octopusConfig.networkId, cloudVendor, accessKey);
  }, [appchain, cloudVendor, accessKey]);

  const refresh = useCallback(() => {
    if (!authKey) {
      if (!accessKey) {
        setIsRefreshing.off();
      }
      return;
    }
    setIsRefreshing.on();
    axios
      .get(`${deployConfig.apiHost}/api/tasks`, {
        headers: {
          authorization: authKey
        }
      })
      .then(res => res.data)
      .then(data => {
        
        if (data.length) {
          const task: OriginTask = data[0];
          setMyTask({
            uuid: task.uuid,
            state: statesRecord[task.state],
            user: task.user,
            instance:
              task.instance ? {
                user: task.instance.user,
                ip: task.instance.ip,
                sshKey: task.instance.ssh_key
              } : null,
            image: deployConfig.baseImages[appchain?.appchainId]
          });
         
        } else {
          setMyTask(null);
          
        }
        setIsRefreshing.off();
      });
  }, [authKey]);

  useEffect(() => {
    refresh();
  }, [authKey]);

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Icon as={AiOutlineCloudServer} boxSize={6} />
          <Heading fontSize="lg">My Node</Heading>
        </HStack>
        <Button size="sm" colorScheme="octoColor" onClick={setSetSessionKeyModalOpen.on} isDisabled={!apiPromise}>
          <Icon as={RiKey2Fill} mr={2} />
          Set Session Key
        </Button>
      </Flex>
      <Skeleton isLoaded={!isRefreshing}>
      <Box mt={3} />
      {
        myTask ?
        <>
          <Box bg="blackAlpha.50" p={3} borderRadius="md">
            <SimpleGrid columns={18} gap={3}>
              <GridItem colSpan={5}>
                <Heading fontSize="sm" color="gray">Node ID</Heading>
              </GridItem>
              <GridItem colSpan={3}>
                <Heading fontSize="sm" color="gray">Status</Heading>
              </GridItem>
              <GridItem colSpan={5}>
                <Heading fontSize="sm" color="gray">Instance</Heading>
              </GridItem>
              <GridItem colSpan={5}>
                <Heading fontSize="sm" color="gray">Operation</Heading>
              </GridItem>
            </SimpleGrid>
          </Box>
          <Box p={3}>
            <TaskRow task={myTask} authKey={authKey} onUpdate={refresh} />
          </Box>
        </> : 
        <>
          <Divider mb={3} />
          <Flex minH="80px" flexDirection="column" alignItems="center" justifyContent="center">
            <HStack>
              <Button size="sm" colorScheme="octoColor" variant="outline" onClick={setDeployModalOpen.on}>
                Deploy Node (Auto Deploy)
              </Button>
              <IconButton aria-label="refresh" onClick={refresh} size="sm">
                <RepeatIcon />
              </IconButton>
            </HStack>
          </Flex>
        </>
      }
      </Skeleton>
      <DeployModal appchain={appchain} onClose={setDeployModalOpen.off} isOpen={deployModalOpen} onDeployed={refresh} />
      <SetSessionKeyModal apiPromise={apiPromise} onClose={setSetSessionKeyModalOpen.off} isOpen={setSessionKeyModalOpen} />
    </>
  );
}
