import React, { useState } from 'react';
import styled from 'styled-components';

import { 
  GridItem,
  Box,
  Heading,
  Text,
  Tag,
  Icon,
  SimpleGrid
} from '@chakra-ui/react';

import { MdKeyboardArrowRight } from 'react-icons/md';
import { fromDecimals } from 'utils';
import Votes from 'components/Votes';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .1);
  }
`;

const InQueueItem = ({
  appchain,
  index
}: {
  appchain: any;
  index: number;
}) => {
 
  const { appchain_id, downvote_deposit, upvote_deposit, voting_score } = appchain;
  const backgrounds = ['yellow', 'blue', 'cyan', 'gray'];

  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 9, md: 15 }} p="6" alignItems="center">
      <GridItem colSpan={1}>
        <Box w="24px" h="24px" borderRadius="12px" bg={`${backgrounds[index] || 'gray'}.500`} display="flex" alignItems="center" justifyContent="center">
          <Heading size="sm" color="white">{index+1}</Heading>
        </Box>
      </GridItem>
      <GridItem colSpan={4}>
        <Heading fontSize="xl">{appchain_id}</Heading>
      </GridItem>
      <GridItem colSpan={6}  display={{ base: 'none', md: 'block' }}>
        <Votes upvotes={upvote_deposit} downvotes={downvote_deposit} />
      </GridItem>
      <GridItem colSpan={3} textAlign="center">
        <Tag variant="outline" colorScheme="octoColor">
          {fromDecimals(voting_score).toFixed(2)}
        </Tag>
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </StyledAppchainItem>
  );
}

export default InQueueItem;
