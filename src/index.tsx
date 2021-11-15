import * as React from 'react';
import ReactDOM from 'react-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import './common.css';
import { App } from './App';

// import locales
const locales = ['en-US', 'zh-CN'];
const i18nResources = {};

const defaultLocale = window.localStorage.getItem('locale') || locales[0];

// reset colormode
window.localStorage.removeItem('chakra-ui-color-mode');

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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);