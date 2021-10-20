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
} from '@chakra-ui/react';

import { MdKeyboardArrowRight } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { fromDecimals } from 'utils';
import { useNavigate } from 'react-router-dom';

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

const StyledBar = styled(Box)`
  border-radius: 5px;
  transition: width .8s ease-out;
`;

const StyledBox = styled(Box)`
  padding: 2px 8px;
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

  const { appchain_id, downvote_deposit, upvote_deposit, voting_score } = appchain;
  const [userUpvoteDeposit, setUserUpvoteDeposit] = useState(0);
  const [userDownvoteDeposit, setUserDownvoteDeposit] = useState(0);

  const backgrounds = ['yellow', 'blue', 'cyan', 'gray'];

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
      onClick={() => navigate(`/appchains/overview/${appchain_id}`)}>
      <GridItem colSpan={4}>
        <HStack>
          <Box w="24px" h="24px" borderRadius="12px" bg={`${backgrounds[index] || 'gray'}.500`} display="flex" alignItems="center" justifyContent="center">
            <Heading size="sm" color="white">{index+1}</Heading>
          </Box>
          <Heading fontSize="lg" ml={2} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={5}  display={{ base: 'none', md: 'block' }}>
        <Box height="35px" position="relative">
          <Tooltip label={
            <Box>
              <Flex alignItems="center">
                <Box w="8px" h="8px" bg="#8884d8" borderRadius={2} />
                <Text fontSize="xs" ml={1}>Upvotes: {upvotes.toFixed(2)}</Text>
              </Flex>
              <Flex alignItems="center">
                <Box w="8px" h="8px" bg="#82ca9d" borderRadius={2} />
                <Text fontSize="xs" ml={1}>Downvotes: {downvotes.toFixed(2)}</Text>
              </Flex>
            </Box>
          }>
            <Box>
              <Box bg="#f5f5fc" borderRadius={15} height="11px" overflow="hidden">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={(upvotes ? 100*upvotes/highestVotes : 0) + '%'} h="8px" bg="#8884d8" />
                    <Text fontSize="xs" ml={1}>{upvotes.toFixed(2)}</Text>
                  </Flex>
                </Box>
              </Box>
              <Box bg="#f5faf5" borderRadius={15} mt={2} height="11px" overflow="hidden">
                <Box mt="-3px" position="relative">
                  <Flex alignItems="center">
                    <StyledBar width={(downvotes ? 100*downvotes/highestVotes : 0) + '%'} h="8px" bg="#82ca9d" />
                    <Text fontSize="xs" ml={1}>{downvotes.toFixed(2)}</Text>
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
            <Text fontSize="xs" ml={1}>Total Score: {score.toFixed(2)}</Text>
            <Text fontSize="xs" ml={1}>Pending Score: {(score+upvotes-downvotes).toFixed(2)}</Text>
          </Box>
        }>
        <HStack spacing={-1}>
          <StyledBox border="1px solid #ccc"
            style={{ opacity: score ? '1' : '0', borderRadius: '30px' }}>
            <HStack spacing={1}>
              <Icon as={FaStar} style={{ width: '12px', height: '12px' }} />
              <Text fontSize="xs">{score.toFixed(2)}</Text>
            </HStack>
          </StyledBox>
          <StyledBox border="1px dashed #ccc"
            style={{ opacity: score ? '2' : '0', borderRadius: '0 30px 30px 0', color: '#9a9a9a', borderLeft: 0 }}>
            <Text fontSize="xs">{(upvotes-downvotes).toFixed(2)}</Text>
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
