import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import dayjs from 'dayjs';

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
import { fromDecimals, NumberUtils } from 'utils';
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
  highestVotes,
  highestScore
}: {
  appchain: any;
  index: number;
  highestVotes: number;
  highestScore: number;
}) => {

  const navigate = useNavigate();
  const [counterData, setCounterData] = useState();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [score, setScore] = useState(0);

  const highest = useRef(0);
  const lowest = useRef(0);

  const { appchain_id, downvote_deposit, upvote_deposit, voting_score, appchain_metadata } = appchain;
  const [userUpvoteDeposit, setUserUpvoteDeposit] = useState(0);
  const [userDownvoteDeposit, setUserDownvoteDeposit] = useState(0);

  const colors = [
    '214,158,46',
    '120,130,200',
    '49,230,206',
  ];

  useEffect(() => {
    setTimeout(() => {
      setUpvotes(fromDecimals(upvote_deposit));
      setDownvotes(fromDecimals(downvote_deposit));
      setScore(fromDecimals(voting_score));
    }, 10);
  }, [downvote_deposit, upvote_deposit]);

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
      setUserUpvoteDeposit(fromDecimals(upvoteDeposit));
      setUserDownvoteDeposit(fromDecimals(downvoteDeposit));
    });
  }, [appchain_id]);

  useEffect(() => {
    axios.get( `/api/counter?appchain=${appchain_id}`)
      .then(res => res.data)
      .then((data: any) => {
        if (data.success) {
          setCounterData(data.data.map(({ voting_score, created_at }) => {
            const score = fromDecimals(voting_score);
            if (score < lowest.current) {
              lowest.current = score;
            } else if (score > highest.current) {
              highest.current = score;
            }
            return {
              date: dayjs(created_at).format('MM-DD'),
              score: score.toFixed(2)
            }
          }));
        }
      });
  }, []);

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
                <Text fontSize="xs" ml={1}>Upvotes: {NumberUtils.showWithCommas(upvotes)}</Text>
              </Flex>
              <Flex alignItems="center">
                <Box w="8px" h="8px" bg="#82ca9d" borderRadius={2} />
                <Text fontSize="xs" ml={1}>Downvotes: {NumberUtils.showWithCommas(downvotes)}</Text>
              </Flex>
            </Box>
          }>
            <Box>
              <Box height="10px">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={(upvotes ? 100*upvotes/highestVotes : 0) + '%'} h="6px" 
                      bg="linear-gradient(to right, #3182CE, #EBF8FF)" />
                    <Text fontSize="xs" ml={1}>{NumberUtils.showWithCommas(upvotes)}</Text>
                  </Flex>
                </Box>
              </Box>
              <Box mt={2} height="10px">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={(downvotes ? 100*downvotes/highestVotes : 0) + '%'} h="6px" 
                      bg="linear-gradient(to right, #68D391, #F0FFF4)" />
                    <Text fontSize="xs" ml={1}>{NumberUtils.showWithCommas(downvotes)}</Text>
                  </Flex>
                </Box>
              </Box>
            </Box>
          </Tooltip>
          {
            (userDownvoteDeposit || userUpvoteDeposit) ?
            <Flex position="absolute" bottom="-14px">
              <HStack color="gray" fontSize="xs">
                <Text >Your Vote:</Text>
                <Text>
                  {
                    userDownvoteDeposit && userUpvoteDeposit ? 
                    `${userUpvoteDeposit} upvotes, ${userDownvoteDeposit} downvotes` :
                    userUpvoteDeposit ?
                    `${userUpvoteDeposit} upvotes` :
                    `${userDownvoteDeposit} downvotes`
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
            <Text fontSize="xs" ml={1}>Total Score: {NumberUtils.showWithCommas(score)}</Text>
            <Text fontSize="xs" ml={1}>Pending Score: {NumberUtils.showWithCommas(score+upvotes-downvotes)}</Text>
          </Box>
        }>
        <HStack spacing={1}>
          <StyledBox
            style={{ opacity: score ? '1' : '0', borderRadius: '30px' }}>
            <HStack spacing={1}>
              <Text>{NumberUtils.showWithCommas(score)}</Text>
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
            <Text fontSize="10px">{(upvotes-downvotes > 0 ? '+' : '')}{NumberUtils.showWithCommas(upvotes-downvotes)}</Text>
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
