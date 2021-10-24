import React from 'react';

import { BigNumber } from 'bignumber.js';

import styled from 'styled-components';

import {
  Progress,
  Flex,
  Text,
  Icon,
  Tooltip,
  Tag,
  Button
} from '@chakra-ui/react';

import { fromDecimals } from 'utils';
import { MdArrowDropUp, MdArrowDropDown } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

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
    transform: scale(.7);
    background: #fff;
    border: 2px solid #0845A5;
    top: 1px;
    right: 0;
    display: ${({ value }) => ( value > 0 ? 'block' : 'none' )};
  }
`;

export const Votes = ({
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
    ).toNumber() :
    100 :
    0;

  return (
    <Flex w="100%" flexDirection="column">
      
      <StyledProgress value={value} size="sm" />
      <Flex mt="2" justifyContent="space-between">
        <Tooltip label={`Upvotes`}>
          <Button borderRadius={30} size="xs" variant="outline">
            <Icon as={MdArrowDropUp} w={5} h={5} />
            <Text>{fromDecimals(upvotes).toFixed(2)}</Text>
          </Button>
        </Tooltip>
        <Tooltip label={`Current voting score: upvotes - downvotes`}>
        <Tag size="sm">
          {t('Score')}: {fromDecimals(upvotes - downvotes).toFixed(2)}
        </Tag>
        </Tooltip>
        <Tooltip label={`Downvotes`}>
          <Button borderRadius={30} size="xs" variant="outline">
            <Icon as={MdArrowDropDown} w={5} h={5} />
            <Text>{fromDecimals(downvotes).toFixed(2)}</Text>
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
}
