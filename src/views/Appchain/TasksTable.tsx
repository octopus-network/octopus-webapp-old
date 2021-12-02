import React, { useState } from 'react';

import {
  Table,
  TableProps,
  Thead,
  Tr,
  Th,
  Tbody,
  Flex,
  Skeleton,
  HStack,
  Text,
  IconButton,
  Tag,
  Td,
  Icon,
  Heading,
  Badge,
  useClipboard,
  Button,
  useToast,
  Link,
  VStack
} from '@chakra-ui/react';

import { Pagination } from 'components';
import { deployConfig } from 'config';
import { CopyIcon, CheckIcon, DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
import { BsFillInfoCircleFill } from 'react-icons/bs';
import axios from 'axios';

import { Task } from 'types';

type TasksTableProps = TableProps & {
  authKey: string;
  tasks: Task[];
  onRefresh: VoidFunction;
  onGoDeploy: VoidFunction;
}

type TaskRowProps = {
  task: Task;
  authKey: string;
  onUpdate: (refreshFactor: number) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, authKey, onUpdate }) => {
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
      .then(res => {
        setLoadingType(null);
        onUpdate(new Date().getTime());
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
      .then(res => {
        setLoadingType(null);
        onUpdate(new Date().getTime());
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
      .then(res => {
        console.log(res);
        setLoadingType(null);
        onUpdate(new Date().getTime());
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
    <Tr>
      <Td>
        <HStack>
          <Text fontSize="sm" whiteSpace="nowrap" w="calc(140px - 30px)"
            overflow="hidden" textOverflow="ellipsis">
            {task.uuid}
          </Text>
          <IconButton aria-label="copy" onClick={onCopyUuid} size="sm">
            { hasUuidCopied ? <CheckIcon /> : <CopyIcon /> }
          </IconButton>
        </HStack>
      </Td>
      <Td>
        <Badge size="sm" colorScheme={task.state.color}>{task.state.label}</Badge>
      </Td>
      <Td>
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
      </Td>
      <Td>
        <Tag size="sm" whiteSpace="nowrap">{task.image?.label}</Tag>
      </Td>
      <Td>
        <HStack>
        {
          task.state.state === 0 ?
          <Button size="sm" colorScheme="octoColor" onClick={onApply}
            isLoading={loadingType === 'apply'} 
            isDisabled={loadingType === 'apply'}
            variant="outline">Apply</Button> : null
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
      </Td>
    </Tr>
  );
}

export const TasksTable: React.FC<TasksTableProps> = ({ authKey, tasks, onGoDeploy, onRefresh, ...props }) => {

  const [page, setPage] = useState(1);
  const [total] = useState(0);
  const [pageSize] = useState(10);
  
  return (
    <Skeleton isLoaded={!!tasks}>
    {
      tasks?.length ?
      <Table variant="simple" {...props}>
        <Thead>
          <Tr>
            <Th>Node ID</Th>
            <Th>State</Th>
            <Th>Instance</Th>
            <Th>Image</Th>
            <Th>Operation</Th>
          </Tr>
        </Thead>
        <Tbody>
          {
            tasks?.map((task, idx) => {
              return (
                <TaskRow key={`task-${idx}`} task={task} authKey={authKey} onUpdate={onRefresh} />
              );
            })
          }
        </Tbody>
      </Table> :
      <Flex minH="180px" flexDirection="column" alignItems="center" justifyContent="center">
        <VStack>
          <Icon color="gray" as={BsFillInfoCircleFill} boxSize={10} />
          <HStack>
            <Heading  color="gray" fontSize="md">No Found Node</Heading>
            <IconButton aria-label="refresh" onClick={onRefresh} size="sm" variant="ghost">
              <RepeatIcon />
            </IconButton>
          </HStack>
        </VStack>
        <Button size="sm" colorScheme="octoColor" mt={4} onClick={onGoDeploy}>Deploy Node</Button>
      </Flex>
    }
   
    {
      total > pageSize ?
        <Flex justifyContent="flex-end" mt={4}>
          <Pagination
            page={page}
            total={total}
            pageSize={pageSize}
            onChange={(p: number) => setPage(p)} />
        </Flex> : null
    }
    </Skeleton>
  );
}