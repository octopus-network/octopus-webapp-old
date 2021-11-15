import React from 'react';
import { useSpring, animated, config as SpringConfig } from 'react-spring';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  Icon,
  Button
} from '@chakra-ui/react';

import { OriginAppchainInfo } from 'types';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { AppchainListItem } from 'components';

type RunningItemProps = {
  appchain: OriginAppchainInfo;
}

const RunningItem: React.FC<RunningItemProps> = ({ appchain }) => {
  const navigate = useNavigate();

  const { animatedStake } = useSpring({
    reset: true,
    from: { animatedStake: 0 },
    animatedStake: DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS).toNumber(),
    config: SpringConfig.slow
  });

  return (
   
    <AppchainListItem columns={{ base: 13, md: 17 }}
      onClick={() => navigate(`/appchains/${appchain.appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain.appchain_id} size="xs" display={{ base: 'none', md: 'block' }}
            bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'}
            src={appchain.appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg">{appchain.appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="xl">{appchain.validator_count}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">
          <animated.span>{animatedStake.to(n => DecimalUtils.beautify(new Decimal(n)))}</animated.span> OCT
        </Text>
      </GridItem>
      
      <GridItem colSpan={4} textAlign="right">
        <Button size="sm">
          <Text>Enter</Text>
          <Icon as={HiOutlineArrowNarrowRight} ml="2" />
        </Button>
      </GridItem>
     
    </AppchainListItem>

  );
}

export default RunningItem;
