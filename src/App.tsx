import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

import defaultTheme from 'config/defaultTheme';

import Root from 'views/Root';
import Home from 'views/Home';
import Appchains from 'views/Appchains';
import AppchainRegister from 'views/Appchains/Register';
import Appchain from 'views/Appchain';
import UserView from 'views/User';
import Dashboard from 'views/User/Dashboard';
import { useTranslation } from 'react-i18next';

export const App = () => {
  const { t } = useTranslation();
  
  return (
    <ChakraProvider theme={defaultTheme}>
      <DocumentTitle title={t('Octopus Network')}>
        <Router>
          <Routes>
            <Route path="/" element={<Root />}>
              <Route path='' element={<Navigate to='home' />} />
              <Route path="home" element={<Home />} />
              <Route path="appchains" element={<Appchains />} />
              <Route path="appchains/join" element={<AppchainRegister />} />
              <Route path="appchains/registered" element={<Appchains />} />
              <Route path="appchains/inqueue" element={<Appchains />} />
              <Route path="appchains/staging" element={<Appchains />} />
              <Route path="appchains/booting" element={<Appchains />} />
              <Route path="appchains/overview/:id" element={<Appchains />} />
              <Route path="appchains/:id" element={<Appchain />} />
              <Route path="user" element={<UserView />}>
                <Route path="dashboard" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </DocumentTitle>
    </ChakraProvider>
  );
}