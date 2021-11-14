import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

import { defaultTheme } from 'config';

import { 
  Bridge,
  Home,
  Root,
  AppchainRegister,
  Appchains,
  Appchain,
  User,
  Profile
} from 'views';

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
              <Route path="" element={<Navigate to='home' />} />
              <Route path="home" element={<Home />} />
              <Route path="appchains" element={<Appchains />} />
              <Route path="appchains/join" element={<AppchainRegister />} />
              <Route path="appchains/overview/:id" element={<Appchains />} />
              <Route path="appchains/:id" element={<Appchain />} />
              <Route path="user" element={<User />}>
                <Route path="dashboard" element={<Dashboard />} />
              </Route>
              <Route path="profile/:id" element={<Profile />} />
              <Route path="bridge" element={<Bridge />} />
            </Route>
          </Routes>
        </Router>
      </DocumentTitle>
    </ChakraProvider>
  );
}