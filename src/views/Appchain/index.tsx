import React from 'react';

import {
  Container
} from '@chakra-ui/react';

import { useParams } from 'react-router-dom';

export const Appchain: React.FC = () => {
  const { id } = useParams();

  return (
    <Container>
      appchain: {id}
    </Container>
  );
}
