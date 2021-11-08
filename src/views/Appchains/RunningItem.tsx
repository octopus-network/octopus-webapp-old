import React from 'react';
import styled from 'styled-components';
import { useSpring, animated, config as SpringConfig } from 'react-spring';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Button
} from '@chakra-ui/react';

import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'config/constants';
import Decimal from 'decimal.js';

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

const RunningItem = ({
  appchain
}: {
  appchain: any;
}) => {
  const navigate = useNavigate();
  const { appchain_id, appchain_metadata, validator_count, total_stake } = appchain;
  const { animatedStake } = useSpring({
    from: { animatedStake: 0 },
    animatedStake: DecimalUtils.fromString(total_stake, OCT_TOKEN_DECIMALS).toNumber(),
    config: SpringConfig.slow
  });

  return (
   
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 13, md: 17 }} p={4} alignItems="center">
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
          <animated.span>{animatedStake.to(n => DecimalUtils.beautify(new Decimal(n)))}</animated.span> OCT
        </Text>
      </GridItem>
      
      <GridItem colSpan={4} textAlign="right">
        <Button>
          <Text>Enter</Text>
          <Icon as={HiOutlineArrowNarrowRight} ml="2" />
        </Button>
      </GridItem>
     
    </StyledAppchainItem>

  );
}

export default RunningItem;
