import React from 'react';
import {
  Container,
  Box,
  Center,
  Heading,
  HStack,
  Link,
  Icon,
  Divider
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

import { FaDiscord, FaTwitter, FaGithub } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <Divider />
      <Box pt="10" pb="10">
        <Center >
          <Heading fontSize="md">@ 2021 {t('Octopus Network')}</Heading>
        </Center>
        <Center mt="5">
          <HStack spacing="4">
            <Link href="https://twitter.com/oct_network" target="_blank">
              <Icon as={FaTwitter} w={5} h={5} />
            </Link>
            <Link href="https://discord.com/invite/6GTJBkZA9Q" target="_blank">
              <Icon as={FaDiscord} w={5} h={5} />
            </Link>
            <Link href="https://github.com/octopus-network" target="_blank">
              <Icon as={FaGithub} w={5} h={5} />
            </Link>
          </HStack>
        </Center>
      </Box>
    </Container>
  );
}

export default Footer;