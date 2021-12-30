import React, { useState } from 'react';
import axios from 'axios';

import {
  Button,
  SimpleGrid,
  GridItem,
  useClipboard,
  useToast,
  HStack,
  Text,
  IconButton,
  Badge,
  Tag,
  Link
} from '@chakra-ui/react';

import { 
  CopyIcon, 
  CheckIcon, 
  DownloadIcon,
  RepeatIcon
} from '@chakra-ui/icons';

import { deployConfig } from 'config';
import { sleep } from 'utils';
import { Task } from 'types';

type TaskRowProps = {
  task: Task;
  authKey: string;
  onUpdate: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, authKey, onUpdate }) => {
  const { hasCopied: hasUuidCopied, onCopy: onCopyUuid } = useClipboard(task.uuid);
  const { hasCopied: hasInstanceCopied, onCopy: onCopyInstance } = useClipboard(
    task.instance ? `${task.instance.user}@${task.instance.ip}` : ''
  );

  const [loadingType, setLoadingType] = useState<string>();
  const toast = useToast();

  const onApply = () => {

    const secretKey = window.prompt('Please enter the secret key of your server', '');

    if (!secretKey) {
      return;
    }

    setLoadingType('apply');
    axios
      .put(
        `${deployConfig.apiHost}/api/tasks/${task.uuid}`,
        { action: 'apply', secret_key: secretKey },
        { headers: { authorization: authKey } }
      )
      .then(() => sleep())
      .then(_ => {
        setLoadingType(null);
        onUpdate();
      })
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setLoadingType(null);
      });
  }

  const onDestroy = () => {

    const secretKey = window.prompt('Please enter the secret key of your server', '');

    if (!secretKey) {
      return;
    }

    setLoadingType('destroy');
    axios
      .put(
        `${deployConfig.apiHost}/api/tasks/${task.uuid}`,
        { action: 'destroy', secret_key: secretKey },
        { headers: { authorization: authKey } }
      )
      .then(() => sleep())
      .then(_ => {
        setLoadingType(null);
        onUpdate();
      })
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setLoadingType(null);
      });
  }

  const onDelete = () => {

    setLoadingType('delete');

    axios
      .delete(
        `${deployConfig.apiHost}/api/tasks/${task.uuid}`,
        { headers: { authorization: authKey } }
      )
      .then(() => sleep())
      .then(_ => {
        onUpdate();
        setLoadingType(null);
      })
      .catch(err => {
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setLoadingType(null);
      });
  }

  return (
    <SimpleGrid columns={18} alignItems="center" gap={3}>
      <GridItem colSpan={5}>
        <HStack>
          <Text fontSize="sm" whiteSpace="nowrap" w="calc(120px - 30px)"
            overflow="hidden" textOverflow="ellipsis">
            {task.uuid}
          </Text>
          <IconButton aria-label="copy" onClick={onCopyUuid} size="sm">
            { hasUuidCopied ? <CheckIcon /> : <CopyIcon /> }
          </IconButton>
        </HStack>
      </GridItem>
      <GridItem colSpan={3}>
        <Badge size="sm" colorScheme={task.state.color}>{task.state.label}</Badge>
      </GridItem>
      <GridItem colSpan={5}>
        {
          task.instance ?
          <HStack>
            <Text fontSize="sm" whiteSpace="nowrap" w="calc(160px - 30px)"
              overflow="hidden" textOverflow="ellipsis">
              {task.instance.user}@{task.instance.ip}
            </Text>
            <IconButton aria-label="copy" onClick={onCopyInstance} size="sm">
              { hasInstanceCopied ? <CheckIcon /> : <CopyIcon /> }
            </IconButton>
          </HStack> : '-'
        }
      </GridItem>
      <GridItem colSpan={5}>
        <HStack>
        {
          task.state.state === 0 ?
          <Button size="sm" colorScheme="octoColor" onClick={onApply}
            isLoading={loadingType === 'apply'} 
            isDisabled={loadingType === 'apply'}
            variant="outline">Apply</Button> : null
        }
        {
          task.state.state === 10 ||
          task.state.state === 20 ?
          <Button size="sm" variant="ghost" onClick={onUpdate}>
            <RepeatIcon mr={1} /> Refresh
          </Button> : null
        }
        {
          task.state.state === 12 ?
          <Button size="sm" colorScheme="octoColor" as={Link} isExternal
            href={task.instance.sshKey}
            variant="outline"><DownloadIcon mr={1} /> RSA</Button> : null
        }
        {
          (
            task.state.state === 11 ||
            task.state.state === 21 ||
            task.state.state === 12
          ) ?
          <Button size="sm" colorScheme="red" onClick={onDestroy}
            isLoading={loadingType === 'destroy'} 
            isDisabled={loadingType === 'destroy'}
            variant="outline">Destroy</Button> : null
        }
        
        {
          (
            task.state.state === 0 ||
            task.state.state === 22
          ) ?
          <Button size="sm" colorScheme="red" onClick={onDelete}
            isLoading={loadingType === 'delete'} 
            isDisabled={loadingType === 'delete'}
            variant="outline">Delete</Button> : null
        }
        </HStack>
      </GridItem>
    </SimpleGrid>
  );
}