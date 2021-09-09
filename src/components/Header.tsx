import React, { useState } from 'react';

import { 
  Container, 
  Flex, 
  Button, 
  Text, 
  HStack, 
  Icon,
  IconButton,
  Box, 
  Image,
  useBoolean,
  Heading,
  Link,
  useColorMode,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar
} from '@chakra-ui/react';

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import LocaleModal from 'components/LocaleModal';
import { ColorModeSwitcher } from 'components/ColorModeSwitcher';

import { loginNear, logoutNear } from 'utils';
import logo from 'assets/logo.png';
import logoWhite from 'assets/logo_white.png';

const Header = () => {

  const [localeModalOpen, setLocalModalOpen] = useBoolean();
  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  const location = useLocation();
  const locationPath = location.pathname;

  const selectedLinkStyle = {
    color: colorMode === 'light' ? 'octoColor.500' : 'white', fontWeight: '600'
  }

  return (
    <>
      <Box position="relative" zIndex="2">
        <Container maxW="container.xl" pt="4" pb="4">
          <Flex justify="space-between" alignItems="center">
            <HStack spacing="12">
              <RouterLink to="/">
                <Image src={colorMode == 'light' ? logo : logoWhite} width="90px" />
              </RouterLink>
              <HStack spacing="5" display={{ base: 'none', lg: 'flex' }}>
                <Link as={RouterLink} to="/home"_selected={selectedLinkStyle}
                  aria-selected={/home/.test(locationPath)}>{t('Home')}</Link>
                <Link as={RouterLink} to="/appchains" _selected={selectedLinkStyle}
                  aria-selected={/appchains/.test(locationPath)}>{t('Appchains')}</Link>
                <Link target="_blank" href="https://bridge.testnet.oct.network">{t('Bridge')}</Link>
                <Link target="_blank" href="https://faucet.testnet.oct.network">{t('Faucet')}</Link>
                <Link target="_blank" href="https://docs.oct.network">{t('Docs')}</Link>
              </HStack>
            </HStack>
            <HStack spacing={3} display={{ base: 'none', lg: 'flex' }} alignItems="center">
              <ColorModeSwitcher />
              <Link onClick={setLocalModalOpen.on}>
                {t('localeName')} <Icon w={3} h={3} as={FaChevronDown} />
              </Link>
              {
                window.walletConnection?.isSignedIn() ?
                <Menu placement="top-end">
                  <MenuButton as={Button} variant="ghost">
                    <HStack>
                      <Avatar w="20px" h="20px" mr="1" />
                      <Text maxW="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{window.accountId}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <RouterLink to="/user/dashboard">
                      <MenuItem>{t('Dashboard')}</MenuItem>
                    </RouterLink>
                    <MenuDivider />
                    <MenuItem onClick={logoutNear}>{t('Sign out')}</MenuItem>
                  </MenuList>
                </Menu> :
                <Button variant="outline" onClick={loginNear}>{t('Login')}</Button>
              }
            </HStack>
            <IconButton aria-label="menu" variant="unstyled" display={{ base: 'block', lg: 'none' }}>
              <Icon w="6" h="6" as={FiMenu} />
            </IconButton>
          </Flex>
        </Container>
        
      </Box>
      <LocaleModal isOpen={localeModalOpen} onClose={setLocalModalOpen.off} />
    </>
  );
}

export default Header;