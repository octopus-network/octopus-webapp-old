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
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';

// const StyledProgress = styled(Progress)<{ value: number }>`
//   border-radius: 3px;
//   [role=progressbar] {
//     position: relative;
//   }
//   [role=progressbar]:after {
//     content: '';
//     position: absolute;
//     width: 6px;
//     background: #fff;
//     top: -5px;
//     right: -3px;
//     bottom: -5px;
//     transform: rotate(35deg);
//     display: ${({ value }) => ( value > 5 && value < 95 ? 'block' : 'none' )};
//   }
// `;
const StyledProgress = styled(Progress)<{ value: number }>`
  background: transparent;
  border-bottom: 2px solid #333;
  overflow: visible;
  [role=progressbar] {
    background: transparent;
    position: relative;
  }
  [role=progressbar]:after {
    content: '';
    position: absolute;
    height: 12px;
    width: 12px;
    border-radius: 6px;
    background: #fff;
    border: 2px solid #333;
    top: 1px;
    right: 0;
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

  return (
    <Flex w="100%" flexDirection="column">
      <Flex justifyContent="space-between">
        <HStack spacing={1}>
          <TriangleUpIcon />
          <Text fontSize="sm">{fromDecimals(upvotes)}</Text>
        </HStack>
        <HStack spacing={1}>
          <TriangleDownIcon />
          <Text fontSize="sm">{fromDecimals(downvotes)}</Text>
        </HStack>
      </Flex>
      <StyledProgress mt="1" value={value} size="sm" colorScheme="blue" />
    </Flex>
  );
}

export default Votes;