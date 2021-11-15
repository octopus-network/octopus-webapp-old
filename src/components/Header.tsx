import React from 'react';

import { 
  Container, 
  Flex, 
  Button, 
  Text, 
  HStack, 
  Icon,
  IconButton,
  Image,
  useBoolean,
  Link,
  useColorMode,
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
import { LocaleModal } from 'components';
import { useGlobalStore } from 'stores';

import { octopusConfig } from 'config';
import logo from 'assets/logo.png';
import logoWhite from 'assets/logo_white.png';

export const Header = () => {

  const globalStore = useGlobalStore(state => state.globalStore);

  const [localeModalOpen, setLocalModalOpen] = useBoolean();
  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  const location = useLocation();
  const locationPath = location.pathname;

  const selectedLinkStyle = {
    color: colorMode === 'light' ? 'octoColor.500' : 'white', fontWeight: '600'
  }

  const onLogin = () => {
    globalStore
      .walletConnection
      .requestSignIn(
        octopusConfig.registryContractId,
        'Octopus Webapp'
      );
  }

  const onLogout = () => {
    globalStore
      .walletConnection
      .signOut();
    
    window.location.replace(window.location.origin + window.location.pathname);
  }

  return (
    <>
      <Container pt={4} pb={4}>
        <Flex justify="space-between" alignItems="center">
          <HStack spacing="12">
            <RouterLink to="/">
              <Image src={colorMode === 'light' ? logo : logoWhite} width="90px" />
            </RouterLink>
            <HStack spacing="5" display={{ base: 'none', lg: 'flex' }}>
              <Link as={RouterLink} to="/home"_selected={selectedLinkStyle}
                aria-selected={/home/.test(locationPath)}>{t('Home')}</Link>
              <Link as={RouterLink} to="/appchains" _selected={selectedLinkStyle}
                aria-selected={/appchains/.test(locationPath)}>{t('Appchains')}</Link>
              <Link as={RouterLink} to="/bridge" _selected={selectedLinkStyle}
                aria-selected={/bridge/.test(locationPath)}>{t('Bridge')}</Link>
              
              {
                octopusConfig.networkId === 'testnet' ?
                <Link target="_blank" href="https://faucet.testnet.oct.network">{t('Faucet')}</Link> : null
              }
              
              <Link target="_blank" href="https://docs.oct.network">{t('Docs')}</Link>
            </HStack>
          </HStack>
          <HStack spacing={3} display={{ base: 'none', lg: 'flex' }} alignItems="center">
            {/* <ColorModeSwitcher /> */}
            <Link onClick={setLocalModalOpen.on}>
              {t('localeName')} <Icon w={3} h={3} as={FaChevronDown} />
            </Link>
            {
              globalStore.walletConnection?.isSignedIn() ?
              <Menu placement="top-end">
                <MenuButton as={Button} variant="ghost">
                  <HStack>
                    <Avatar w="20px" h="20px" mr="1" />
                    <Text maxW="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {globalStore.accountId}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <RouterLink to="/user/dashboard">
                    <MenuItem>{t('Dashboard')}</MenuItem>
                  </RouterLink>
                  <MenuDivider />
                  <MenuItem onClick={onLogout}>{t('Sign out')}</MenuItem>
                </MenuList>
              </Menu> :
              <Button variant="outline" onClick={onLogin}>{t('Login')}</Button>
            }
          </HStack>
          <Menu placement="top-end">
            <MenuButton as={IconButton} aria-label="menu" variant="unstyled" display={{ base: 'block', lg: 'none' }}>
              <Icon w="6" h="6" as={FiMenu} />
            </MenuButton>
            <MenuList>
              <RouterLink to="/home">
                <MenuItem>{t('Home')}</MenuItem>
              </RouterLink>
              <RouterLink to="/appchains">
                <MenuItem>{t('Appchains')}</MenuItem>
              </RouterLink>
            </MenuList>
          </Menu>
        </Flex>
      </Container>
      <LocaleModal isOpen={localeModalOpen} onClose={setLocalModalOpen.off} />
    </>
  );
}
