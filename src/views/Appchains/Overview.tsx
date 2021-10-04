import React, { useEffect, useState, useRef } from 'react';

import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Link,
  Icon,
  Divider,
  Skeleton,
  Flex,
  List,
  useClipboard,
  IconButton,
  DrawerBody,
  DrawerFooter,
  Avatar,
  Badge,
  Button,
  useBoolean,
  Input,
  useToast,
  Tooltip,
  Tag
} from '@chakra-ui/react';

import dayjs from 'dayjs';
import axios from 'axios';
import { loginNear, fromDecimals } from 'utils';
import { AiOutlineUser, AiOutlineGlobal, AiFillGithub, AiOutlineFileZip } from 'react-icons/ai';
import { FaStarHalfAlt } from 'react-icons/fa';
import { IoMdTime } from 'react-icons/io';
import { ExternalLinkIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { HiOutlineMail } from 'react-icons/hi';
import StateBadge from 'components/StateBadge';
import ScoreChart from 'components/ScoreChart';
import Permissions from './Permissions';
import octopusConfig from 'config/octopus';

const Overview = ({ appchainId }) => {

  const [appchainStatus, setAppchainStatus] = useState<any>();
  const { hasCopied, onCopy } = useClipboard(appchainStatus?.appchain_metadata?.contact_email);
  const [isOwner, setIsOwner] = useState(false);
  const toast = useToast();

  const [counterData, setCounterData] = useState();
  const highestScore = useRef(0);
  const lowestScore = useRef(Number.MAX_SAFE_INTEGER);

  const [isEditing, setIsEditing] = useBoolean(false);
  const [isUpdating, setIsUpdating] = useBoolean(false);
  const [appchainMetadata, setAppchainMeataData] = useState({});

  const isAdmin = window.accountId && (
    new RegExp(`\.${window.accountId}`).test(octopusConfig.registryContractId) ||
    window.accountId === octopusConfig.registryContractId
  );

  useEffect(() => {
    axios.get( `/api/counter?appchain=${appchainId}`)
      .then(res => res.data)
      .then((data: any) => {
        if (data.success) {
          setCounterData(data.data.map(({ voting_score, created_at }) => {
            const score = fromDecimals(voting_score);
            if (score < lowestScore.current) {
              lowestScore.current = score;
            } else if (score > highestScore.current) {
              highestScore.current = score;
            }
            return {
              date: dayjs(created_at).format('MM-DD'),
              score
            }
          }));
        }
      });
  }, []);
  
  useEffect(() => {
    window
      .registryContract
      .get_appchain_status_of({
        appchain_id: appchainId
      })
      .then(status => {
        console.log(status);
        setAppchainStatus(status);
        setAppchainMeataData(status.appchain_metadata);
        setIsOwner(window.accountId && status?.appchain_owner === window.accountId);
      });
  }, [appchainId]);

  const onUpdate = async () => {
    setIsUpdating.on();
    
    try {
      delete appchainMetadata['custom_metadata'];
      await window
        .registryContract
        .update_appchain_custom_metadata({
          appchain_id: appchainId,
          custom_metadata: appchainMetadata
        });

      window.location.reload();
    } catch(err) {
      setIsEditing.off();
      setIsUpdating.off();
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    }
  }

  const onAppchainMetadataChange = (k, v) => {
    setAppchainMeataData(Object.assign({}, appchainMetadata, {[k]: v}));
  }
  
  return (

    <>
    <DrawerBody>
      <Flex justifyContent="space-between" alignItems="center">
        <VStack alignItems="flex-start" spacing="3">
          <HStack>
            <Skeleton isLoaded={!!appchainStatus}>
              <Heading fontSize="3xl">{appchainStatus?.appchain_id || 'loading...'}</Heading>
            </Skeleton>
            <StateBadge state={appchainStatus?.appchain_state} />
          </HStack>
          <Skeleton isLoaded={!!appchainStatus}>
            <HStack color="gray" spacing={5} fontSize="sm">
              <Link isExternal href={`${octopusConfig.explorerUrl}/accounts/${appchainStatus?.appchain_owner}`}>
                <HStack>
                  <Icon as={AiOutlineUser} />
                  <Text>{appchainStatus?.appchain_owner || 'loading...'}</Text>
                </HStack>
              </Link>
              <HStack>
                <Icon as={IoMdTime} />
                <Text>
                  {
                    appchainStatus ? dayjs(
                      appchainStatus.registered_time.substr(0, 13) * 1
                    ).format('YYYY-MM-DD HH:mm') : 'loading...'
                  }
                </Text>
              </HStack>
            </HStack>
          </Skeleton>
        </VStack>
        <Permissions status={appchainStatus} onEdit={setIsEditing.on} onUpdate={onUpdate} onCancelEdit={setIsEditing.off} />
      </Flex>
      <Divider mt="6" mb="6" />
      <List>
        {
          appchainStatus?.appchain_state === 'InQueue' &&
          <>
          <Box>
            <Flex justifyContent="space-between">
              <HStack>
                <Icon as={FaStarHalfAlt} w={5} h={5} />
                <Text>Total Score</Text>
              </HStack>
              <Tag>{fromDecimals(appchainStatus?.voting_score)}</Tag>
            </Flex>
            <Skeleton isLoaded={counterData}>
            <Box width="100%" height="80px" mt={4}>
              <ScoreChart data={counterData} highest={highestScore.current} 
                lowest={lowestScore.current} showDate={true} />
            </Box>
            </Skeleton>
          </Box>
          <Divider mt="4" mb="4" />
          </>
        }
        {
          appchainStatus?.appchain_metadata?.website_url &&
          <>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineGlobal} w={5} h={5} />
              <Text>Website</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.website_url} 
                onChange={e => onAppchainMetadataChange('website_url', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.website_url} isExternal>
                {appchainStatus?.appchain_metadata?.website_url} <ExternalLinkIcon mx="2px" />
              </Link>
            }
          </Flex>
          <Divider mt="4" mb="4" />
          </>
        }
        
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiFillGithub} w={5} h={5} />
              <Text>Github</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_address} 
                onChange={e => onAppchainMetadataChange('github_address', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.github_address} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.github_address}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link>
            }
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineFileZip} w={5} h={5} />
              <Text>Release</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.github_release} 
                onChange={e => onAppchainMetadataChange('github_release', e.target.value)} width="auto" /> :
              <Link href={appchainStatus?.appchain_metadata?.github_release} isExternal>
                <HStack>
                  <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {appchainStatus?.appchain_metadata?.github_release}
                  </Box>
                  <ExternalLinkIcon mx="2px" />
                </HStack>
              </Link>
            }
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between"c>
            <HStack>
              <Icon as={HiOutlineMail} w={5} h={5} />
              <Text>Email</Text>
            </HStack>
            {
              isEditing ?
              <Input disabled={isUpdating} defaultValue={appchainStatus?.appchain_metadata?.contact_email} 
                onChange={e => onAppchainMetadataChange('contact_email', e.target.value)} width="auto" /> :
              <HStack>
                <Text>{appchainStatus?.appchain_metadata?.contact_email}</Text>
                <IconButton size="sm" aria-label="Copy" icon={
                  hasCopied ? <CheckIcon />: <CopyIcon />
                } onClick={onCopy} />
              </HStack>
            }
          </Flex>
        </Skeleton>
      </List>
    </DrawerBody>
    <DrawerFooter bg="rgba(120, 120, 150, .08)">
      {
        window.accountId ?
        <HStack>
          <Avatar size="xs" />
          <Text>{window.accountId}</Text>
          { 
            isOwner && 
            <Tooltip label="Owner of this appchain">
              <Badge colorScheme="green">Owner</Badge>
            </Tooltip>
          }
          { 
            isAdmin && 
            <Tooltip label="Admin of Octopus Registry">
              <Badge colorScheme="purple">Admin</Badge>
            </Tooltip>
          }
        </HStack> :
        <Button size="sm" onClick={loginNear}>
          <Avatar size="xs" mr="1" />
          <Text color="gray">Login</Text>
        </Button>
      }
    </DrawerFooter>
    </>
  
  );
}

export default Overview;