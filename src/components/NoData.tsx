import React from 'react';

import {
  Flex,
  Image,
  Text
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';
import bg from 'assets/nodata.png';

export const NoData = ({ ...rest }) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center" flexDirection="column" justifyContent="center" minH="320px">
      <Image src={bg} h={{ base: '110px', md: '140px' }}  />
      <Text color="gray" fontSize="sm">{t('No Data')}</Text>
    </Flex>
  );
}
