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
  Skeleton,
  Text
} from '@chakra-ui/react';


import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip as ChartTooltip, 
  YAxis,
  ResponsiveContainer,
} from 'recharts';

import { MdKeyboardArrowRight } from 'react-icons/md';
import { fromDecimals } from 'utils';
import Votes from 'components/Votes';
import ScoreChart from 'components/ScoreChart';

const StyledAppchainItem = styled(SimpleGrid)`
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: rgba(122, 122, 122, .1);
  }
`;

const CustomTooltip = ({ 
  label,
  active,
  payload
}: {
  label?: any;
  active?: boolean;
  payload?: any;
}) => {
 
  if (active && payload && payload.length) {
    return (
      <Box bg="rgba(120, 120, 155, .1)" p={1} borderRadius={3}>
        <Text fontSize="xs">{payload[0].payload.date}: {payload[0].payload.score}</Text>
      </Box>
    );
  }
  return null;
}

const InQueueItem = ({
  appchain,
  index
}: {
  appchain: any;
  index: number;
}) => {
  
  const [counterData, setCounterData] = useState();

  const highestScore = useRef(0);
  const lowestScore = useRef(Number.MAX_SAFE_INTEGER);

  const { appchain_id, downvote_deposit, upvote_deposit, voting_score } = appchain;
  const backgrounds = ['yellow', 'blue', 'cyan', 'gray'];

  useEffect(() => {
    axios.get( `/api/counter?appchain=${appchain_id}`)
      .then(res => res.data)
      .then((data: any) => {
        if (data.success) {
          setCounterData(data.data.map(({ voting_score, created_at }) => {
            const score = fromDecimals(voting_score);
            if (score < lowestScore.current) {
              lowestScore.current = score;
            } else if (score > highestScore.current) {
              highestScore.current = score;
            }
            return {
              date: dayjs(created_at).format('MM-DD'),
              score
            }
          }));
        }
      });
  }, []);

  return (
    <StyledAppchainItem boxShadow="octoShadow" columns={{ base: 9, md: 15 }} p="6" alignItems="center">
      <GridItem colSpan={4}>
        <HStack>
          <Box w="24px" h="24px" borderRadius="12px" bg={`${backgrounds[index] || 'gray'}.500`} display="flex" alignItems="center" justifyContent="center">
            <Heading size="sm" color="white">{index+1}</Heading>
          </Box>
          <Heading fontSize="xl" ml={2}>{appchain_id}</Heading>
        </HStack>
      </GridItem>
      <GridItem colSpan={6}  display={{ base: 'none', md: 'block' }}>
        <Votes upvotes={upvote_deposit} downvotes={downvote_deposit} />
      </GridItem>
      <GridItem colSpan={1} />
      <GridItem colSpan={3} textAlign="center">
        <Skeleton isLoaded={counterData}>
          <Box width="100%" height="38px">
            <ScoreChart data={counterData} highest={highestScore.current} lowest={lowestScore.current} />
          </Box>
        </Skeleton>
      </GridItem>
      <GridItem colSpan={1} textAlign="right">
        <Icon as={MdKeyboardArrowRight} color="rgba(0, 0, 0, .3)" w={6} h={6} />
      </GridItem>
    </StyledAppchainItem>
  );
}

export default InQueueItem;
