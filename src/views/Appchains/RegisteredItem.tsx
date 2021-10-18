import React, { useState } from 'react';
import styled from 'styled-components';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import StateBadge from 'components/StateBadge';
import { MdKeyboardArrowRight } from 'react-icons/md';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .1);
  }
`;

const BootingItem = ({
  appchain
}: {
  appchain: any;
}) => {
  const { appchain_id, appchain_owner, appchain_state, appchain_metadata } = appchain;
  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 10, md: 14 }} p="6" alignItems="center">
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="sm" display={{ base: 'none', md: 'block' }} src={appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>
        <Text fontSize="lg">{appchain_owner}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <StateBadge state={appchain_state} />
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </StyledAppchainItem>
  );
}

export default BootingItem;
