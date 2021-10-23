import React from 'react';

import {
  Badge
} from '@chakra-ui/react';

const state2color = {
  'Registered': 'cyan',
  'Auditing': 'green',
  'Voting': 'teal',
  'Staging': 'blue',
  'Booting': 'yellow'
}

export const StateBadge = ({ state, size = 'md', varaint = 'subtle' }) => {
  return (
    <Badge colorScheme={state2color[state]} size={size} variant={varaint}>{state}</Badge>
  )
}
