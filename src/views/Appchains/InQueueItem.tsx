import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSpring, config as SpringConfig, animated } from 'react-spring';

import { 
  GridItem,
  Box,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  Flex,
  Tooltip,
  Avatar
} from '@chakra-ui/react';

import { OriginAppchainInfo } from 'types';

import { MdKeyboardArrowRight } from 'react-icons/md';
import Decimal from 'decimal.js';
import { OCT_TOKEN_DECIMALS } from 'primitives';
import { DecimalUtils, ZERO_DECIMAL, ONE_HUNDRED_DECIMAL } from 'utils';
import { useNavigate } from 'react-router-dom';
import { AppchainListItem } from 'components';
import { useGlobalStore } from 'stores';

const StyledBox = styled(Box)`
  
  transition: opacity .8s ease-out;
  white-space: nowrap;
`;

type InQueueItemProps = {
  appchain: OriginAppchainInfo;
  index: number;
  highestVotes: Decimal;
}

const InQueueItem: React.FC<InQueueItemProps> = ({
  appchain,
  index,
  highestVotes
}) => {

  const navigate = useNavigate();
  
  const globalStore = useGlobalStore(state => state.globalStore);
  const [upvotes, setUpvotes] = useState(ZERO_DECIMAL);
  const [downvotes, setDownvotes] = useState(ZERO_DECIMAL);
  const [score, setScore] = useState(ZERO_DECIMAL);

  const [userUpvoteDeposit, setUserUpvoteDeposit] = useState(ZERO_DECIMAL);
  const [userDownvoteDeposit, setUserDownvoteDeposit] = useState(ZERO_DECIMAL);

  const colors = [
    '214,158,46',
    '120,130,200',
    '49,230,206',
  ];

  useEffect(() => {

    const { downvote_deposit, upvote_deposit, voting_score } = appchain;
    setUpvotes(
      DecimalUtils.fromString(upvote_deposit, OCT_TOKEN_DECIMALS)
    );
    setDownvotes(
      DecimalUtils.fromString(downvote_deposit, OCT_TOKEN_DECIMALS)
    );
    setScore(
      DecimalUtils.fromString(voting_score, OCT_TOKEN_DECIMALS)
    );
  }, [appchain]);

  useEffect(() => {
   
    Promise.all([
      globalStore.registryContract.get_upvote_deposit_for({
        appchain_id: appchain.appchain_id,
        account_id: globalStore.accountId
      }),
      globalStore.registryContract.get_downvote_deposit_for({
        appchain_id: appchain.appchain_id,
        account_id: globalStore.accountId
      })
    ]).then(([upvoteDeposit, downvoteDeposit]) => {
      setUserUpvoteDeposit(
        DecimalUtils.fromString(upvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      setUserDownvoteDeposit(
        DecimalUtils.fromString(downvoteDeposit, OCT_TOKEN_DECIMALS)
      );
    });
  }, [appchain, globalStore]);

  const { animatedUpvotes } = useSpring({
    reset: true,
    from: { animatedUpvotes: 0 },
    delay: 200,
    config: SpringConfig.slow,
    animatedUpvotes: upvotes.toNumber()
  });

  const { animatedDownvotes } = useSpring({
    reset: true,
    from: { animatedDownvotes: 0 },
    delay: 200,
    config: SpringConfig.slow,
    animatedDownvotes: downvotes.toNumber()
  });

  const { animatedScore } = useSpring({
    reset: true,
    from: { animatedScore: 0 },
    to: { animatedScore: score.toNumber() },
    delay: 200,
    config: { ...SpringConfig.slow, duration: 1500 },
  });

  const pendingTagProps = useSpring({ opacity: 1, delay: 2500, from: { opacity: 0 } });
  const upvotesBarProps = useSpring({
    reset: true,
    from: { width: '0%' },
    width: highestVotes.gt(ZERO_DECIMAL) ? upvotes.mul(ONE_HUNDRED_DECIMAL).div(highestVotes).toString() + '%' : '0%',
    height: '6px',
    delay: 200,
    config: SpringConfig.slow,
    background: '#8884d8',
    borderRadius: '3px'
  });

  const downvotesBarProps = useSpring({
    reset: true,
    from: { width: '0%' },
    width: highestVotes.gt(ZERO_DECIMAL) ? downvotes.mul(ONE_HUNDRED_DECIMAL).div(highestVotes).toString() + '%' : '0%',
    height: '6px',
    delay: 200,
    config: SpringConfig.slow,
    background: '#82ca9d',
    borderRadius: '3px'
  });

  return (
    <AppchainListItem columns={{ base: 9, md: 14 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: index < 3 ? `rgba(${colors[index]},.3)` : 'transparent',
        boxShadow: index < 3 ? '' : 'rgb(0 0 0 / 20%) 0px 0px 2px'
      }}
      onClick={() => navigate(`/appchains/overview/${appchain.appchain_id}`)}>
      {
        index < 3 ?
        <Flex position="absolute" left={0} top={0} bg={`linear-gradient(to right bottom, rgba(${colors[index]},1), transparent 80%)}`}
          alignItems="center" justifyContent="center" borderEndEndRadius="9px" style={{
            width: '18px',
            height: '18px',
          }}>
          <Heading fontSize="xs" color="white">{index+1}</Heading>
        </Flex> : null
      }
      <GridItem colSpan={4}>
        <HStack>
          <Avatar name={appchain.appchain_id} size="xs" display={{ base: 'none', md: 'block' }}
            bg={appchain.appchain_metadata?.fungible_token_metadata?.icon ? 'white' : 'blue.100'}
            src={appchain.appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg" ml={2} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{appchain.appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={5}  display={{ base: 'none', md: 'block' }}>
        <SimpleGrid columns={2} gap={10}>
          <Tooltip label={`Upvotes: ${DecimalUtils.beautify(upvotes)}`}>
            <Box position="relative" mt={-1}>
              <Text color="gray" fontSize="sm">
                <animated.span>
                  {animatedUpvotes.to(n => DecimalUtils.beautify(new Decimal(n)))}
                </animated.span>
              </Text>
              <Flex bg="blackAlpha.100" borderRadius="3px" overflow="hidden">
                <animated.div style={upvotesBarProps} />
              </Flex>
              {
                userUpvoteDeposit.gt(ZERO_DECIMAL) ?
                <Text color="gray" fontSize="xs" position="absolute" transform="scale(.8)" transformOrigin="left">
                  Your upvotes: {DecimalUtils.beautify(userUpvoteDeposit)}
                </Text> : null
              }
            </Box>
          </Tooltip>
          <Tooltip label={`Downvotes: ${DecimalUtils.beautify(downvotes)}`}>
            <Box position="relative" mt={-1}>
              <Text color="gray" fontSize="sm">
                <animated.span>
                  {animatedDownvotes.to(n => DecimalUtils.beautify(new Decimal(n)))}
                </animated.span>
              </Text>
              <Flex bg="blackAlpha.100" borderRadius="3px" overflow="hidden">
                <animated.div style={downvotesBarProps} />
              </Flex>
              {
                userDownvoteDeposit.gt(ZERO_DECIMAL) ?
                <Text color="gray" fontSize="xs" position="absolute" transform="scale(.8)" transformOrigin="left">
                  Your downvotes: {DecimalUtils.beautify(userDownvoteDeposit)}
                </Text> : null
              }
            </Box>
          </Tooltip>
        </SimpleGrid>
        
      </GridItem>
      <GridItem colSpan={1} />
      <GridItem colSpan={3} textAlign="center">
        <Tooltip label={
          <Box>
            <Text fontSize="xs" ml={1}>
              Total Score: {DecimalUtils.beautify(score)}
            </Text>
            <Text fontSize="xs" ml={1}>
              Pending Score: {DecimalUtils.beautify(score.add(upvotes).minus(downvotes))}
            </Text>
          </Box>
        }>
        <HStack spacing={1}>
          <StyledBox
            style={{ opacity: score ? 1 : 0, borderRadius: '30px' }}>
            <HStack spacing={1}>
              <Text>
                <animated.span>
                  {animatedScore.to(n => DecimalUtils.beautify(new Decimal(n)))}
                </animated.span>
              </Text>
            </HStack>
          </StyledBox>
          <animated.div style={pendingTagProps}>
            <StyledBox style={{ 
                marginTop: '-15px',
                opacity: score ? 1 : 0,
                padding: '0px 5px', 
                borderRadius: '30px', 
                color: '#9a9a9a', 
                borderLeft: 0,
                fontWeight: 600,
                transform: 'scale(.9)',
                border: '1px solid #eee'
              }}>
              <Text fontSize="10px">
                { (upvotes.add(downvotes).gt(ZERO_DECIMAL) ? '+' : '') }
                { DecimalUtils.beautify(upvotes.minus(downvotes)) }
              </Text>
            </StyledBox>
          </animated.div>
        </HStack>
        </Tooltip>
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </AppchainListItem>
  );
}

export default React.memo(InQueueItem);
