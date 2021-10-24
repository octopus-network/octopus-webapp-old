import React from 'react';
import styled from 'styled-components';

import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  Link
} from '@chakra-ui/react';

import { ChevronRightIcon } from '@chakra-ui/icons';
import octopusConfig from 'config/octopus';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const StyledItem = styled(Flex)`
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .05);
  }
`;

const ActivityItem = ({ activity, ...rest }) => {
  const { action_kind, block_timestamp, hash, receiver_id } = activity;

  const actionKinds = {
    'TRANSFER': receiver_id === window.accountId ? 'Received NEAR' : 'Sent NEAR',
    'CREATE_ACCOUNT': 'New account created',
    'ADD_KEY': 'Access Key added',
    'FUNCTION_CALL': 'Method called'
  }

  const actionTo = {
    'TRANSFER': receiver_id === window.accountId ? 'from' : 'to',
    'CREATE_ACCOUNT': 'account',
    'ADD_KEY': 'for',
    'FUNCTION_CALL': `${activity.args?.method_name} in `,
  }

  const actionTarget = {
    'TRANSFER': 'activity.receiver_id',
    'CREATE_ACCOUNT': 'activity.receiver_id',
    'ADD_KEY': `
      activity.args.access_key.permission.permission_kind === 'FULL_ACCESS' ? 
      activity.receiver_id :
      activity.args.access_key.permission.permission_details.receiver_id
    `,
    'FUNCTION_CALL': 'activity.args.args_json.receiver_id'
  }

  return (
    <Link isExternal href={`${octopusConfig.explorerUrl}/transactions/${hash}`}>
    <StyledItem alignItems="center" justifyContent="space-between" {...rest} pt="4" pb="4">
      <Flex alignItems="flex-start" spacing="0" w="60%" flexDirection="column">
        <Heading fontSize="md" fontWeight="600">{actionKinds[action_kind]}</Heading>
        <Box fontSize="sm" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" w="100%">
          <Text as="span" color="gray" mr="1">{actionTo[action_kind]}</Text>
          <Text as="span">
            {eval(`${actionTarget[action_kind]}`)}
          </Text>
        </Box>
      </Flex>
      <HStack color="gray">
        <Text fontSize="sm">
          {dayjs(block_timestamp.substr(0, 13) * 1).fromNow()}
        </Text>
        <ChevronRightIcon />
      </HStack>
    </StyledItem>
    </Link>
  );
}

export default ActivityItem;