import React from 'react';

import {
  Box,
  Heading,
  Text,
  Flex,
  Skeleton
} from '@chakra-ui/react';

export const StatCard = ({
  title,
  value,
  bg,
  icon
}: {
  title: string;
  value: string;
  bg: string;
  icon: any;
}) => {

  return (
    <Skeleton isLoaded={!!value} borderRadius="10">
    <Box p={7} bgGradient={bg} borderRadius="2xl"
      overflow="hidden" position="relative" boxShadow="rgb(0 0 0 / 15%) 0px 0px 8px">
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="whiteAlpha.800">{title}</Text>
      </Flex>
      <Box mt={2}>
        <Heading fontSize="3xl" color="whiteAlpha.900">{value || 'loading'}</Heading>
      </Box>
      <Box position="absolute" transform="scale(4.6)" 
        bottom="0" right="0" opacity=".6">
        {icon}
      </Box>
    </Box>
    </Skeleton>
  );
}
