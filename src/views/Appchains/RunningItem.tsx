import React, { useMemo, useState, useEffect } from 'react';
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

import { OriginAppchainInfo, AnchorContract } from 'types';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import Decimal from 'decimal.js';
import { AppchainListItem } from 'components';
import { useRefDataStore, useGlobalStore } from 'stores';
import { tokenAssets } from 'config';

type RunningItemProps = {
  appchain: OriginAppchainInfo;
}

const RunningItem: React.FC<RunningItemProps> = ({ appchain }) => {
  const navigate = useNavigate();

  const { refData } = useRefDataStore();

  const globalStore = useGlobalStore(state => state.globalStore);
  const [delegatorCount, setDelegatorCount] = useState(0);

  useEffect(() => {
    globalStore
      .registryContract
      .get_appchain_status_of({ appchain_id: appchain.appchain_id })
      .then(({ appchain_anchor }) => {
        const contract = new AnchorContract(
          globalStore.walletConnection.account(),
          appchain_anchor,
          {
            viewMethods: [
              'get_anchor_status'
            ],
            changeMethods: []
          }
        );

        contract.get_anchor_status().then(status => {
          setDelegatorCount(status.delegator_count_in_next_era || '0');
        });
      });
  }, [appchain, globalStore]);

  const apy = useMemo(() => {
    if (!appchain || !refData) return 0;
    const tokenAsset = tokenAssets[appchain.appchain_id]?.[0];
    if (!tokenAsset) {
      return 0;
    }
    const appchainTokenData = refData.find(data => data.ftInfo?.symbol === tokenAsset.symbol);
    const octTokenData = refData.find(data => data.ftInfo?.symbol === 'OCT');
    
    if (!appchainTokenData || !octTokenData) {
      return 0;
    }

    return DecimalUtils.fromNumber(5_000_000 * appchainTokenData.price * 100).div(
      DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS).mul(
        octTokenData.price
      )
    ).toNumber();
  }, [refData, appchain]);

  const { animatedStake } = useSpring({
    reset: true,
    from: { animatedStake: 0 },
    animatedStake: DecimalUtils.fromString(appchain.total_stake, OCT_TOKEN_DECIMALS).toNumber(),
    config: SpringConfig.slow
  });

  const { animatedAPY } = useSpring({
    reset: true,
    from: { animatedAPY: 0 },
    animatedAPY: apy,
    config: SpringConfig.slow
  });

  return (
   
    <AppchainListItem columns={{ base: 15, md: 19 }}
      onClick={() => navigate(`/appchains/${appchain.appchain_id}`)}>
      <GridItem colSpan={5}>
        <HStack>
          <Avatar name={appchain.appchain_id} size="xs" display={{ base: 'none', md: 'block' }}
            bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'}
            src={appchain.appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg">{appchain.appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="xl">{appchain.validator_count}</Text>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="xl">{delegatorCount}</Text>
      </GridItem>
      <GridItem colSpan={4}>
        <Text fontSize="md">
          <animated.span>{animatedStake.to(n => DecimalUtils.beautify(new Decimal(n)))}</animated.span> OCT
        </Text>
      </GridItem>
      <GridItem colSpan={2}>
        {
          apy > 0 ?
          <Heading fontSize="lg" bg="linear-gradient(to right, #fcc00a, #4ebae9)" 
            bgClip="text" color="transparent" animation="hue 10s linear infinite;">
            <animated.span>{animatedAPY.to(n => DecimalUtils.beautify(new Decimal(n)))}</animated.span>%
          </Heading> : '-'
        }
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
