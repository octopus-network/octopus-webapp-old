import * as React from 'react';
import ReactDOM from 'react-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { connect, keyStores, WalletConnection, Contract } from 'near-api-js';

import octopusConfig from 'config/octopus';
import './common.css';
import { App } from './App';

// import locales
const locales = ['en-US', 'zh-CN'];
const i18nResources = {};

const defaultLocale = window.localStorage.getItem('locale') || locales[0];

// reset colormode
window.localStorage.removeItem('chakra-ui-color-mode');

const initNear = async () => {
  const near = await connect(
    Object.assign(
      { deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } },
      octopusConfig
    )
  );
  
  window.walletConnection = new WalletConnection(near, 'octopus_bridge');
  window.accountId = window.walletConnection.getAccountId();
  window.pjsAccount = window.localStorage.getItem('pjsAccount') || undefined;

  window.registryContract = await new Contract(
    window.walletConnection.account(),
    octopusConfig.registryContractId,
    {
      viewMethods: [
        'get_minimum_register_deposit', 
        'get_appchains_with_state_of', 
        'get_appchain_status_of', 
        'get_registry_settings',
        'get_upvote_deposit_for', 
        'get_downvote_deposit_for', 
        'get_appchains_count_of', 
        'get_total_stake', 
        'get_owner'
      ],
      changeMethods: [
        'start_auditing_appchain', 
        'reject_appchain', 
        'remove_appchain', 
        'pass_auditing_appchain', 
        'update_appchain_metadata',
        'withdraw_upvote_deposit_of', 
        'withdraw_downvote_deposit_of', 
        'count_voting_score', 
        'conclude_voting_score'
      ]
    }
  );

  window.tokenContract = await new Contract(
    window.walletConnection.account(),
    octopusConfig.tokenContractId,
    {
      viewMethods: ['ft_balance_of'],
      changeMethods: ['ft_transfer_call']
    }
  );

} 

locales.forEach((locale) => {
  i18nResources[locale] = {
    translation: require(`locales/${locale}/translation.json`)
  }
});

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // the translations
    // (tip move them in a JSON file and import them,
    // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
    resources: i18nResources,
    lng: defaultLocale, // if you're using a language detector, do not define the lng option
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });

initNear()
  .then(() => {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById('root')
    );
  });
