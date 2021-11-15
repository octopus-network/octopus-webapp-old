import React from 'react';

import { 
  GridItem,
  HStack,
  Avatar,
  Heading,
  Text,
  Icon
} from '@chakra-ui/react';

import { OriginAppchainInfo } from 'types';
import { StateBadge, AppchainListItem } from 'components';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

type BootingItemProps = {
  appchain: OriginAppchainInfo;
}

const BootingItem: React.FC<BootingItemProps> = ({ appchain }) => {
  const navigate = useNavigate();

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
      <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>
        <Text fontSize="lg">{appchain.appchain_owner}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <StateBadge state={appchain.appchain_state} />
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </AppchainListItem>
  );
}

export default BootingItem;
