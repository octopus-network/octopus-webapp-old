import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

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

import { MdKeyboardArrowRight } from 'react-icons/md';
import Decimal from 'decimal.js';
import { OCT_TOKEN_DECIMALS } from 'config/constants';
import { DecimalUtils, ZERO_DECIMAL, ONE_HUNDRED_DECIMAL } from 'utils';
import { useNavigate } from 'react-router-dom';

const StyledAppchainItem = styled(SimpleGrid)`
  overflow: hidden;
  position: relative;
  border-radius: 10px;
  transition: transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s;
  cursor: pointer;
  &:hover {
    box-shadow: rgb(0 0 0 / 15%) 0px 0px 10px!important;
    transform: scaleX(0.99);
  }
`;

const StyledBar = styled(Box)`
  border-radius: 5px;
  transition: width .8s ease-out;
  min-width: 2%;
`;

const StyledBox = styled(Box)`
  
  transition: opacity .8s ease-out;
  white-space: nowrap;
`;

const InQueueItem = ({
  appchain,
  index,
  highestVotes
}: {
  appchain: any;
  index: number;
  highestVotes: Decimal;
}) => {

  const navigate = useNavigate();
 
  const [upvotes, setUpvotes] = useState(ZERO_DECIMAL);
  const [downvotes, setDownvotes] = useState(ZERO_DECIMAL);
  const [score, setScore] = useState(ZERO_DECIMAL);

  const { appchain_id, downvote_deposit, upvote_deposit, voting_score, appchain_metadata } = appchain;
  const [userUpvoteDeposit, setUserUpvoteDeposit] = useState(ZERO_DECIMAL);
  const [userDownvoteDeposit, setUserDownvoteDeposit] = useState(ZERO_DECIMAL);

  const colors = [
    '214,158,46',
    '120,130,200',
    '49,230,206',
  ];

  useEffect(() => {
    setTimeout(() => {
      setUpvotes(
        DecimalUtils.fromString(upvote_deposit, OCT_TOKEN_DECIMALS)
      );
      setDownvotes(
        DecimalUtils.fromString(downvote_deposit, OCT_TOKEN_DECIMALS)
      );
      setScore(
        DecimalUtils.fromString(voting_score, OCT_TOKEN_DECIMALS)
      );
    }, 10);
  }, [downvote_deposit, upvote_deposit, voting_score]);

  useEffect(() => {
    if (!appchain_id) {
      return;
    }

    Promise.all([
      window.registryContract.get_upvote_deposit_for({
        appchain_id,
        account_id: window.accountId
      }),
      window.registryContract.get_downvote_deposit_for({
        appchain_id,
        account_id: window.accountId
      })
    ]).then(([upvoteDeposit, downvoteDeposit]) => {
      setUserUpvoteDeposit(
        DecimalUtils.fromString(upvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      setUserDownvoteDeposit(
        DecimalUtils.fromString(downvoteDeposit, OCT_TOKEN_DECIMALS)
      );
    });
  }, [appchain_id]);

  return (
    <StyledAppchainItem columns={{ base: 9, md: 14 }} p={4} alignItems="center"
      style={{
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: index < 3 ? `rgba(${colors[index]},.3)` : 'transparent',
        boxShadow: index < 3 ? '' : 'rgb(0 0 0 / 20%) 0px 0px 2px'
      }}
      onClick={() => navigate(`/appchains/overview/${appchain_id}`)}>
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
          <Avatar name={appchain_id} size="xs" display={{ base: 'none', md: 'block' }} bg="blue.100" src={appchain_metadata?.fungible_token_metadata?.icon} />
          <Heading fontSize="lg" ml={2} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={5}  display={{ base: 'none', md: 'block' }}>
        <Box height="35px" position="relative">
          <Tooltip label={
            <Box>
              <Flex alignItems="center">
                <Box w="8px" h="8px" bg="#8884d8" borderRadius={2} />
                <Text fontSize="xs" ml={1}>
                  Upvotes: {DecimalUtils.beautify(upvotes)}
                </Text>
              </Flex>
              <Flex alignItems="center">
                <Box w="8px" h="8px" bg="#82ca9d" borderRadius={2} />
                <Text fontSize="xs" ml={1}>
                  Downvotes: {DecimalUtils.beautify(downvotes)}
                </Text>
              </Flex>
            </Box>
          }>
            <Box>
              <Box height="10px">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={upvotes.mul(ONE_HUNDRED_DECIMAL).div(highestVotes).toNumber() + '%'} h="6px" 
                      bg="linear-gradient(to right, #3182CE, #EBF8FF)" />
                    <Text fontSize="xs" ml={1}>
                      {DecimalUtils.beautify(upvotes)}
                    </Text>
                  </Flex>
                </Box>
              </Box>
              <Box mt={2} height="10px">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={downvotes.mul(ONE_HUNDRED_DECIMAL).div(highestVotes).toNumber() + '%'} h="6px" 
                      bg="linear-gradient(to right, #68D391, #F0FFF4)" />
                    <Text fontSize="xs" ml={1}>
                      {DecimalUtils.beautify(downvotes)}
                    </Text>
                  </Flex>
                </Box>
              </Box>
            </Box>
          </Tooltip>
          {
            (userDownvoteDeposit.gt(ZERO_DECIMAL) || userUpvoteDeposit.gt(ZERO_DECIMAL)) ?
            <Flex position="absolute" bottom="-14px">
              <HStack color="gray" fontSize="xs">
                <Text >Your Vote:</Text>
                <Text>
                  {
                    userDownvoteDeposit.gt(ZERO_DECIMAL) && userUpvoteDeposit.gt(ZERO_DECIMAL) ? 
                    `${
                      DecimalUtils.beautify(userUpvoteDeposit)
                    } upvotes, ${
                      DecimalUtils.beautify(userDownvoteDeposit)
                    } downvotes` :
                    userUpvoteDeposit.gt(ZERO_DECIMAL) ?
                    `${
                      DecimalUtils.beautify(userUpvoteDeposit)
                    } upvotes` :
                    `${
                      DecimalUtils.beautify(userDownvoteDeposit)
                    } downvotes`
                  }
                </Text>
              </HStack>
            </Flex> : null
          }
        </Box>
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
            style={{ opacity: score ? '1' : '0', borderRadius: '30px' }}>
            <HStack spacing={1}>
              <Text>{DecimalUtils.beautify(score)}</Text>
            </HStack>
          </StyledBox>
          <StyledBox style={{ 
              marginTop: '-15px',
              opacity: score ? '2' : '0',
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
        </HStack>
        </Tooltip>
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </StyledAppchainItem>
  );
}

export default InQueueItem;
