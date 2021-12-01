import React, { useEffect, ReactNode, useState } from 'react';

import {
  Button,
  Text,
  useBoolean
} from '@chakra-ui/react';

import { useGlobalStore } from 'stores';
import { octopusConfig } from 'config';
import { isWeb3Injected, web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ChooseAccountModal } from './ChooseAccountModal';
import { AccountModal } from './AccountModal';

import { toShortAddress } from 'utils';

type AccountProps = {
  appchainId: string;
  avatar: ReactNode;
  isReverse: boolean;
  nearAccount: string;
  appchainAccount: string;
  onChooseAccount: (account: InjectedAccountWithMeta) => void;
}

export const Account: React.FC<AccountProps> = ({ appchainId, isReverse, nearAccount, appchainAccount, avatar, onChooseAccount }) => {

  const globalStore = useGlobalStore(state => state.globalStore);
  const [appchainAccounts, seAppchainAccounts] = useState<InjectedAccountWithMeta[]>();
  const [chooseAccountModalOpen, setChooseAccountModalOpen] = useBoolean(false);
  const [accountModalOpen, setAccountModalOpen] = useBoolean(false);

  useEffect(() => {
    web3Enable('Octopus Network').then(res => {
      web3Accounts().then(accounts => {
        if (accounts.length) {
          seAppchainAccounts(accounts);
        } else {
          const storageAccounts = JSON.parse(window.localStorage.getItem('appchainAccounts') || '{}');
          storageAccounts[appchainId] = '';
          window.localStorage.setItem('appchainAccounts', JSON.stringify(storageAccounts));
        }
        
      });
    });
  }, [appchainId]);

  const onLogin = () => {
    globalStore
      .walletConnection
      .requestSignIn(
        octopusConfig.registryContractId,
        'Octopus Webapp'
      );
  }

  const _onChooseAccount = (account: InjectedAccountWithMeta) => {
    onChooseAccount(account);
    setChooseAccountModalOpen.off();
    const storageAccounts = JSON.parse(window.localStorage.getItem('appchainAccounts') || '{}');
    storageAccounts[appchainId] = account.address;
    window.localStorage.setItem('appchainAccounts', JSON.stringify(storageAccounts));
  }

  return (
    <>
      {
        isReverse ?
        <Button size="sm" onClick={!nearAccount ? onLogin : setAccountModalOpen.on} variant="outline">
          {avatar}
          <Text ml={1}>
            { !!nearAccount ? nearAccount : 'Login' }
          </Text>
        </Button> :
        <Button size="sm" isDisabled={!isWeb3Injected} variant="outline"
          onClick={!appchainAccount ? setChooseAccountModalOpen.on : setAccountModalOpen.on}>
          {avatar}
          <Text ml={1}>
            { 
              !!appchainAccount ? 
              toShortAddress(appchainAccount) : 
              isWeb3Injected ? 
              'Choose Account' :
              'No Wallet' 
            }
          </Text>
        </Button>
      }
      <ChooseAccountModal accounts={appchainAccounts} isOpen={chooseAccountModalOpen} onClose={setChooseAccountModalOpen.off} 
        onChoose={_onChooseAccount} />
      <AccountModal isOpen={accountModalOpen} onClose={setAccountModalOpen.off} onChangeAccount={() => {
        setAccountModalOpen.off();
        setChooseAccountModalOpen.on();
      }} isNearAccount={isReverse} account={isReverse ? nearAccount : appchainAccount} appchainId={appchainId} avatar={avatar} />
    </>
  );
}