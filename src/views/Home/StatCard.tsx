import React, { useMemo } from 'react';

import {
  Box,
  Heading,
  Text,
  Flex,
  Skeleton
} from '@chakra-ui/react';
import { NumberUtils } from 'utils';

export const StatCard = ({
  title,
  value,
  icon
}: {
  title: string;
  value: string|number;
  icon: any;
}) => {
  const isValueValid = useMemo(() => value >= 0, [value]); 
  const valueLabel = useMemo(() => NumberUtils.showWithCommas(+value, 0) , [value]);

  return (
    <Skeleton isLoaded={isValueValid} borderRadius="10">
    <Box p="5" boxShadow="octoShadow" borderRadius="10" bg="rgba(255, 255, 255, .05)"
      overflow="hidden" position="relative">
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontSize="sm">{title}</Text>
        {icon}
      </Flex>
      <Box mt="4">
        <Heading fontSize="2xl">{isValueValid ? valueLabel : 'loading'}</Heading>
      </Box>
      <Box position="absolute" transform="scale(4.6)" 
        bottom="0" right="0" opacity=".08">
      {icon}
      </Box>
    </Box>
    </Skeleton>
  );
}
