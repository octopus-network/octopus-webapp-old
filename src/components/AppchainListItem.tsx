import React from 'react';

import {
  SimpleGrid,
  SimpleGridProps,
  useColorModeValue
} from '@chakra-ui/react';

export const AppchainListItem: React.FC<SimpleGridProps> = ({ children, ...rest }) => {
  const bg = useColorModeValue('white', 'blackAlpha.800');
  return (
    <SimpleGrid 
      {...rest}
      p={4}
      alignItems="center"
      borderRadius="xl"
      boxShadow="rgb(0 0 0 / 20%) 0px 0px 2px"
      cursor="pointer"
      transition="transform 0.2s ease-in-out 0s, box-shadow 0.2s ease-in-out 0s"
      bg={bg}
      _hover={{ 
        boxShadow: 'rgb(0 0 0 / 15%) 0px 0px 10px',
        transform: 'scaleX(0.99)'
      }}
    >
      {children}
    </SimpleGrid>
  );
}