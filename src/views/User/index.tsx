import React from 'react';
import {
  Tabs,
  TabList,
  Tab,
  Container,
  Box
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

export const User: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Box bg="rgba(0, 0, 0, .03)">
        <Container>
          <Tabs>
            <TabList borderWidth={0}>
              <Tab><Link to='/user/dashboard'>{t('Dashboard')}</Link></Tab>
            </TabList>
          </Tabs>
        </Container>
      </Box>
      <Outlet />
    </>
  );
}
