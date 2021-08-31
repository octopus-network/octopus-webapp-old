import React from 'react';

import {
  Box,
  Flex,
  Avatar,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';

import { fromDecimals } from 'utils';

const TokenItem = ({ token, ...rest }) => {
  const [metadata, balance, contractId] = token;
  return (
    <Box {...rest} pt="4" pb="4">
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <Avatar name={metadata.symbol} src={metadata.icon} bg={'gray.100'} p="1" size="sm" /> 
          <VStack alignItems="flex-start" spacing="0" ml="4">
            <Heading fontSize="lg" fontWeight="600">{metadata.symbol}</Heading>
            <Text color="gray" fontSize="sm">{contractId}</Text>
          </VStack>
        </Flex>
        <VStack alignItems="flex-end" spacing="0">
          <Heading fontSize="md" fontWeight="600">{fromDecimals(balance, metadata.decimals)}</Heading>
          <Text color="gray" fontSize="sm">- USD</Text>
        </VStack>
      </Flex>
    </Box>
  );
}

export default TokenItem;