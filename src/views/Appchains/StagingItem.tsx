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

const StagingItem = ({
  appchain
}: {
  appchain: any;
}) => {
  const navigate = useNavigate();
  const { appchain_id, validators } = appchain;
 
  return (
    <StyledAppchainItem columns={{ base: 14, md: 14 }} p={4} alignItems="center"
      onClick={() => navigate(`/appchains/overview/${appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="xs" display={{ base: 'none', md: 'block' }} bg="blue.100" />
          <Heading fontSize="lg">{appchain_id}</Heading>
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
