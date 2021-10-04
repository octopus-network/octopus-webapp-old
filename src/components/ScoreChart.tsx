import React from 'react';

import { 
  Box,
  Text
} from '@chakra-ui/react';

import { 
  AreaChart, 
  Area, 
  Tooltip as ChartTooltip, 
  YAxis,
  XAxis,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ 
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
        <Text fontSize="xs">{payload[0].payload.date + ': '}{payload[0].payload.score}</Text>
      </Box>
    );
  }
  return null;
}

export default function ScoreChart({ data, lowest, highest, showDate }: {
  data: any[],
  lowest: number,
  highest: number,
  showDate?: boolean
}) {

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e3964e" stopOpacity={0.5}/>
            <stop offset="70%" stopColor="#e3964e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis hide={true} domain={[lowest, highest]} />
        {
          showDate !== undefined && 
          <XAxis axisLine={false} tickLine={false} height={20} dataKey="date" interval="preserveStartEnd" 
            tick={{ fontSize: '13px', fill: '#9c9c9c' }} />
        }
        <ChartTooltip position={{ y: 0 }} content={<CustomTooltip  />} />
        <Area type="monotone" strokeWidth={2} dataKey="score"
          stroke="#e3964e" fill="url(#colorPrice)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}