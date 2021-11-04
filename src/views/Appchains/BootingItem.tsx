import React from 'react';
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

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { NumberUtils, fromDecimals } from 'utils';

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
  const { appchain_id, appchain_metadata, validator_count, total_stake } = appchain;
  
  return (
   
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 13, md: 17 }} p={4} alignItems="center"
      onClick={() => navigate(`/appchains/overview/${appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain_id} size="xs" display={{ base: 'none', md: 'block' }} bg="blue.100"
            src={appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{validator_count}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">{NumberUtils.showWithCommas(fromDecimals(total_stake))} OCT</Text>
      </GridItem>
      
      <GridItem colSpan={4} textAlign="right" display={{ base: 'none', md: 'block' }}>
        <Button>Enter <Icon as={HiOutlineArrowNarrowRight} ml="1" /></Button>
      </GridItem>
     
    </StyledAppchainItem>

  );
}

export default BootingItem;
