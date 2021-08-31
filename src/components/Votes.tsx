import React from 'react';

import { BigNumber } from 'bignumber.js';

import styled from 'styled-components';

import {
  Progress,
  Flex,
  Text,
  HStack,
  Icon
} from '@chakra-ui/react';

import { fromDecimals } from 'utils';
import { BiLike, BiDislike } from 'react-icons/bi';

const StyledProgress = styled(Progress)<{ value: number }>`
  border-radius: 3px;
  [role=progressbar] {
    position: relative;
  }
  [role=progressbar]:after {
    content: '';
    position: absolute;
    width: 6px;
    background: #fff;
    top: -5px;
    right: -3px;
    bottom: -5px;
    transform: rotate(35deg);
    display: ${({ value }) => ( value > 5 && value < 95 ? 'block' : 'none' )};
  }
`;

const Votes = ({
  upvotes,
  downvotes
}: {
  upvotes: number;
  downvotes: number;
}) => {

  const value = upvotes > 0 ? 
    downvotes > 0 ?
    new BigNumber(upvotes).times(100).dividedBy(
      new BigNumber(upvotes).plus(new BigNumber(downvotes))
    ) :
    100 :
    0;

  console.log(value, upvotes, upvotes+downvotes);

  return (
    <Flex w="100%" flexDirection="column">
      <Flex justifyContent="space-between">
        <HStack spacing={1} color="gray">
          <Icon as={BiLike} />
          <Text fontSize="sm">{fromDecimals(upvotes)}</Text>
        </HStack>
        <HStack spacing={1} color="gray">
          <Icon as={BiDislike} />
          <Text fontSize="sm">{fromDecimals(downvotes)}</Text>
        </HStack>
      </Flex>
      <StyledProgress mt="1" value={value} size="sm" bg={ downvotes > 0 ? 'red' : 'gray.200' } colorScheme="blue" />
    </Flex>
  );
}

export default Votes;