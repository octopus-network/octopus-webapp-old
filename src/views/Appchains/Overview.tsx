import React, { useEffect, useState } from 'react';

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
  Button,
  DrawerBody,
} from '@chakra-ui/react';

import dayjs from 'dayjs';
import { AiOutlineUser, AiOutlineGlobal, AiFillGithub, AiOutlineFileZip } from 'react-icons/ai';
import { IoMdTime } from 'react-icons/io';
import { ExternalLinkIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { HiOutlineMail } from 'react-icons/hi';
import StateBadge from 'components/StateBadge';
import Permissions from './Permissions';
import octopusConfig from 'config/octopus';

const Overview = ({ appchainId }) => {

  const [appchainStatus, setAppchainStatus] = useState<any>();
  const { hasCopied, onCopy } = useClipboard(appchainStatus?.appchain_metadata?.contact_email);
  
  useEffect(() => {
    window
      .registryContract
      .get_appchain_status_of({
        appchain_id: appchainId
      })
      .then(status => {
        setAppchainStatus(status);
      });
  }, [appchainId]);

  return (

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
        <Permissions status={appchainStatus} />
      </Flex>
      <Divider mt="6" mb="6" />
      <List>
        
        {
          appchainStatus?.appchain_metadata?.website_url &&
          <>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineGlobal} w={5} h={5} />
              <Text>Website</Text>
            </HStack>
            <Link href={appchainStatus?.appchain_metadata?.website_url} isExternal>
              {appchainStatus?.appchain_metadata?.website_url} <ExternalLinkIcon mx="2px" />
            </Link>
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
            <Link href={appchainStatus?.appchain_metadata?.github_address} isExternal>
              <HStack>
                <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {appchainStatus?.appchain_metadata?.github_address}
                </Box>
                <ExternalLinkIcon mx="2px" />
              </HStack>
            </Link>
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between">
            <HStack>
              <Icon as={AiOutlineFileZip} w={5} h={5} />
              <Text>Release</Text>
            </HStack>
            <Link href={appchainStatus?.appchain_metadata?.github_release} isExternal>
              <HStack>
                <Box maxW="240px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {appchainStatus?.appchain_metadata?.github_release}
                </Box>
                <ExternalLinkIcon mx="2px" />
              </HStack>
            </Link>
          </Flex>
        </Skeleton>
        <Divider mt="4" mb="4" />
        <Skeleton isLoaded={!!appchainStatus}>
          <Flex justifyContent="space-between"c>
            <HStack>
              <Icon as={HiOutlineMail} w={5} h={5} />
              <Text>Email</Text>
            </HStack>
            <HStack>
              <Text>{appchainStatus?.appchain_metadata?.contact_email}</Text>
              <IconButton size="sm" aria-label="Copy" icon={
                hasCopied ? <CheckIcon />: <CopyIcon />
              } onClick={onCopy} />
            </HStack>
          </Flex>
        </Skeleton>
      </List>
      
    </DrawerBody>
  
  );
}

export default Overview;