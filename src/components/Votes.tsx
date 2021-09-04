import React from 'react';

import { BigNumber } from 'bignumber.js';

import styled from 'styled-components';

import {
  Progress,
  Flex,
  Text,
  HStack,
  Icon,
  Tooltip,
  Tag
} from '@chakra-ui/react';

import { fromDecimals } from 'utils';
import { BiUpArrow, BiDownArrow } from 'react-icons/bi';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

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
  border-bottom: 2px solid #eee;
  overflow: visible;
  [role=progressbar] {
    background: transparent;
    position: relative;
    width: 0%;
    transition: width .3s ease;
  }
  [role=progressbar]:after {
    content: '';
    position: absolute;
    height: 12px;
    width: 12px;
    border-radius: 6px;
    transform: scale(.8);
    background: #fff;
    border: 2px solid #0845A5;
    top: 1px;
    right: 0;
    display: ${({ value }) => ( value > 0 ? 'block' : 'none' )};
  }
`;

const Votes = ({
  upvotes,
  downvotes
}: {
  upvotes: number;
  downvotes: number;
}) => {

  const { t } = useTranslation();
  const value = upvotes > 0 ? 
    downvotes > 0 ?
    new BigNumber(upvotes).times(100).dividedBy(
      new BigNumber(upvotes).plus(new BigNumber(downvotes))
    ) :
    100 :
    0;

  return (
    <Flex w="100%" flexDirection="column">
      
      <StyledProgress value={value} size="sm" />
      <Flex mt="2" justifyContent="space-between">
        <Tooltip label={`Upvotes ${fromDecimals(upvotes)}`}>
        <HStack spacing={1} color="#0845A5" fontSize="sm">
          <Icon as={BiUpArrow} />
          <Text>{fromDecimals(upvotes)}</Text>
        </HStack>
        </Tooltip>
        <Tag size="sm" variant="outline" colorScheme="octoColor">
          {t('Score')}: {fromDecimals(upvotes - downvotes)}
        </Tag>
        <Tooltip label={`Downvotes ${fromDecimals(downvotes)}`}>
        <HStack spacing={1} color="#0845A5" fontSize="sm">
          <Icon as={BiDownArrow} />
          <Text>{fromDecimals(downvotes)}</Text>
        </HStack>
        </Tooltip>
      </Flex>
    </Flex>
  );
}

export default Votes;