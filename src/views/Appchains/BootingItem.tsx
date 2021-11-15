import React from 'react';
import { useSpring, animated, config as SpringConfig } from 'react-spring';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  Icon
} from '@chakra-ui/react';

import { OriginAppchainInfo } from 'types';

import { MdKeyboardArrowRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { AppchainListItem } from 'components';

type BootingItemProps = {
  appchain: OriginAppchainInfo;
}

const BootingItem: React.FC<BootingItemProps> = ({ appchain }) => {
  const navigate = useNavigate();
 
  const { animatedStake } = useSpring({
    reset: true,
    from: { animatedStake: 0 },
    animatedStake: DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS).toNumber(),
    config: SpringConfig.slow
  });

  return (
   
    <AppchainListItem columns={{ base: 10, md: 14 }}
      onClick={() => navigate(`/appchains/overview/${appchain.appchain_id}`)}>
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
      
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
     
    </AppchainListItem>

  );
}

export default BootingItem;
