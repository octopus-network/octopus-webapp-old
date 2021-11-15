import React from 'react';

import {
  Badge
} from '@chakra-ui/react';

const state2color = {
  'Registered': 'gray',
  'Auditing': 'green',
  'Voting': 'teal',
  'Staging': 'blue',
  'Booting': 'yellow',
  'Active': 'cyan'
}

const state2label = {
  'Registered': 'Pre-Audit',
  'Dead': 'Pre-Audit',
  'Auditing': 'Auditing',
  'InQueue': 'Voting',
  'Staging': 'Staking',
  'Booting': 'Booting',
  'Active': 'Running'
}

export const StateBadge = ({ state, size = 'md', varaint = 'subtle' }) => {
  return (
    <Badge 
      colorScheme={state2color[state]} 
      size={size} 
      variant={varaint} 
      borderRadius="xl"
      >
      {state2label[state] || 'Unknown'}
    </Badge>
  )
}
