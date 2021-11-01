import React from 'react';

import {
  Container,
  Box,
  Center,
  Heading,
  HStack,
  Link,
  Icon,
  Text
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';
import octopusConfig from 'config/octopus';
import { FaDiscord, FaTwitter, FaGithub } from 'react-icons/fa';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <Container mt="16">
      <Box>
        <Box p="4" bg="rgba(120, 120, 155, .06)" borderRadius="5">
          <Center whiteSpace="nowrap" overflow="hidden">
            <HStack spacing={4}>
              <Link href="#">Term of service</Link>
              <Text color="gray.300">|</Text>
              <Link href="#">Privacy policy</Link>
              <Text color="gray.300">|</Text>
              <Link target="_blank"
                href={`${octopusConfig.explorerUrl}/accounts/${octopusConfig.registryContractId}`}>Registry Contract</Link>
              <Text color="gray.300">|</Text>
              <Link target="_blank"
                href={`${octopusConfig.explorerUrl}/accounts/${octopusConfig.tokenContractId}`}>Token Contract</Link>
            </HStack>
          </Center>
        </Box>
      </Box>
      <Box pb="10" mt="10">
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
