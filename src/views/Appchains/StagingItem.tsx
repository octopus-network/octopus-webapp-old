import React, { useState } from 'react';
import styled from 'styled-components';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Icon
} from '@chakra-ui/react';

import { MdKeyboardArrowRight } from 'react-icons/md';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .1);
  }
`;

const StagingItem = ({
  appchain
}: {
  appchain: any;
}) => {
 
  const { appchain_id, validators } = appchain;

  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 14, md: 14 }} p="6" alignItems="center">
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="sm" display={{ base: 'none', md: 'block' }} bg="blue.100" />
          <Heading fontSize="xl">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{0}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">{0} OCT</Text>
      </GridItem>
      
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
     
    </StyledAppchainItem>
  );
}

export default StagingItem;
