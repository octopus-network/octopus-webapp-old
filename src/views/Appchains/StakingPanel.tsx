import React, { useEffect, useState } from 'react';

import {
  List,
  Flex,
  Heading,
  Button,
  Box,
  HStack,
  useBoolean,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Skeleton,
} from '@chakra-ui/react';

import { fromDecimals } from 'utils';
import { useTranslation } from 'react-i18next';
import RegisterValidatorModal from 'components/RegisterValidatorModal';
import ValidatorsTable from 'components/ValidatorsTable';

const StakingPanel = ({ status, anchor }) => {
  const { appchain_id } = status;
  const [depositAmount, setDepositAmount] = useState<any>();
  const [registerModalOpen, setRegsiterModalOpen] = useBoolean(false);

  const initialFocusRef = React.useRef();
  const { t } = useTranslation();

  useEffect(() => {
    anchor
      .get_validator_deposit_of({
        validator_id: window.accountId
      })
      .then(deposit => {
        setDepositAmount(fromDecimals(deposit));
      });
  }, [anchor]);

  const onRegisterSuccess = () => {

  }

  return (
    <>
    <Box>
      <Skeleton isLoaded={depositAmount !== undefined}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="lg">Validators</Heading>
        {
          depositAmount > 0 ?
          <HStack>
            <Button size="sm" colorScheme="octoColor">Stake more</Button>
            <Button size="sm" colorScheme="red">Unstake</Button>
          </HStack> :
          <Button size="sm" colorScheme="octoColor" onClick={setRegsiterModalOpen.on}>Register</Button>
          // <Popover
          //   initialFocusRef={initialFocusRef}
          //   placement="bottom"
          //   isOpen={registerPopoverOpen}
          //   onClose={setRegisterPopoverOpen.off}
          //   >
          //   <PopoverTrigger>
          //     <Button colorScheme="octoColor"
          //       isDisabled={registerPopoverOpen} onClick={setRegisterPopoverOpen.on}>Register</Button>
          //   </PopoverTrigger>
          //   <PopoverContent>
          //     <PopoverBody>
          //       <Box p="2" d="flex">
          //         <Heading fontSize="lg">Register</Heading>
          //       </Box>
          //     </PopoverBody>
          //     <PopoverFooter d="flex" justifyContent="flex-end">
          //       <HStack spacing={3}>
          //         <Button size="sm" onClick={setRegisterPopoverOpen.off}>{t('Cancel')}</Button>
          //         <Button size="sm" colorScheme="octoColor">{t('Confirm')}</Button>
          //       </HStack>
          //     </PopoverFooter>
          //   </PopoverContent>
          // </Popover>
        }
      </Flex>
      </Skeleton>
      <Box mt={4} p={2} borderWidth={1} borderRadius={10}>
        <ValidatorsTable anchor={anchor} />
      </Box>
      
    </Box>
    <RegisterValidatorModal isOpen={registerModalOpen} onClose={setRegsiterModalOpen.off}
      anchor={anchor} onSuccess={onRegisterSuccess} />
    </>
  );
}

export default StakingPanel;