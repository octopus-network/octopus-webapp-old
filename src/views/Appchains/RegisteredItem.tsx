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
import { useNavigate } from 'react-router-dom';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  box-shadow: rgb(0 0 0 / 20%) 0px 0px 2px;
  transition: transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s;
  cursor: pointer;
  &:hover {
    box-shadow: rgb(0 0 0 / 15%) 0px 0px 10px;
    transform: scaleX(0.99);
  }
`;

const BootingItem = ({
  appchain
}: {
  appchain: any;
}) => {
  const navigate = useNavigate();

  const { appchain_id, appchain_owner, appchain_state, appchain_metadata } = appchain;
  return (
    <StyledAppchainItem columns={{ base: 10, md: 14 }} p={4} alignItems="center" 
      onClick={() => navigate(`/appchains/overview/${appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="xs" display={{ base: 'none', md: 'block' }} src={appchain_metadata?.fungible_token_metadata?.icon} />
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
