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

import { Link as RouterLink } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';

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
 
  const { appchain_id, validators } = appchain;
  // const totalStaked = validators.reduce(
  //   (total, b) => total + b.staked_amount,
  //   0
  // );
  
  return (
    // <RouterLink to={`/appchains/${appchain_id}`}>
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 13, md: 17 }} p="6" alignItems="center">
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="sm" display={{ base: 'none', md: 'block' }} bg="blue.100" />
          <Heading fontSize="lg">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{0}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">{0} OCT</Text>
      </GridItem>
      
      <GridItem colSpan={4} textAlign="right" display={{ base: 'none', md: 'block' }}>
        {/* <RouterLink to={`/appchains/${appchain_id}`}>
          <Button>Enter <Icon as={HiOutlineArrowNarrowRight} ml="1" /></Button>
        </RouterLink> */}
        <Button>Enter <Icon as={HiOutlineArrowNarrowRight} ml="1" /></Button>
      </GridItem>
     
    </StyledAppchainItem>
    // </RouterLink>
  );
}

export default BootingItem;
