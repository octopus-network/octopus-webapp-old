import React, { useEffect, useState, useRef } from 'react';

import {
  useToast,
  Spinner,
  useColorMode,
  Box
} from '@chakra-ui/react';

import { utils, providers } from "near-api-js";
import octopusConfig from 'config/octopus';
import Footer from 'components/Footer';
import Header from 'components/Header';
import { useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const Loading = () => {
  return (
    <Box p="2">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="md"
      />
    </Box>
  );
}

const Root = () => {
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const transactionHashes = urlParams.get('transactionHashes') || '';
  const errorMessage = urlParams.get('errorMessage') || '';

  const { colorMode } = useColorMode();
  const location = useLocation();
  const navigate = useNavigate();
  const toastIdRef = useRef<any>();

  const checkRedirect = () => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate('/appchains/registered');
    }
  }

  useEffect(() => {
    if (transactionHashes) {
      toastIdRef.current = toast({
        position: 'top-right',
        render: () => <Loading />,
        status: 'info',
        duration: null
      });
      const provider = new providers.JsonRpcProvider(octopusConfig.archivalUrl);
      provider
        .txStatus(transactionHashes, window.accountId)
        .then(status => {
          const { receipts_outcome } = status;
          let message = '';
          for (let i = 0; i < receipts_outcome.length; i++) {
            const { outcome } = receipts_outcome[i];
            if ((outcome.status as any).Failure) {
              message = JSON.stringify((outcome.status as any).Failure);
              break;
            }
          }
          if (message) {
            throw new Error(message);
          } else {
            toast.update(toastIdRef.current, {
              description: 'Success',
              duration: 1500,
              variant: 'left-accent',
              status: 'success'
            });
            checkRedirect();
          }
        }).catch(err => {
          setTimeout(() => {
            toast.update(toastIdRef.current, {
              description: err.toString(),
              duration: 2500,
              status: 'error'
            });
          }, 500);
        });
    } else if (errorMessage) {
      toast({
        position: 'top-right',
        description: decodeURIComponent(errorMessage),
        status: 'error'
      });
    }

    // clear message
    const { protocol, host, pathname, search, hash } = window.location;
    urlParams.delete('errorMessage');
    urlParams.delete('transactionHashes');
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${params ? '?' + params : ''}${hash}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

  }, [errorMessage, transactionHashes]);

  return (
    <div style={{ 
      backgroundImage: colorMode === 'light' ? 
        'linear-gradient(to bottom, #f5f6f9, #fff 30%)' : '',
      backgroundSize: '100% 100vh',
      backgroundRepeat: 'no-repeat'
    }}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Root;