import React from 'react';
import styled from 'styled-components';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  SimpleGrid,
  Icon
} from '@chakra-ui/react';

import { MdKeyboardArrowRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'config/constants';

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
   
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 10, md: 14 }} p={4} alignItems="center"
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
        <Text fontSize="md">
          {
            DecimalUtils.beautify(
              DecimalUtils.fromString(total_stake, OCT_TOKEN_DECIMALS)
            )
          } OCT
        </Text>
      </GridItem>
      
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
     
    </StyledAppchainItem>

  );
}

export default BootingItem;
