import React, { useEffect, useState } from 'react';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  Box,
  Flex,
  Text,
  Link,
  VStack,
  Button,
  useBoolean,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  Input,
  HStack,
  useToast,
  Spinner
} from '@chakra-ui/react';

import { fromDecimals, toDecimals } from 'utils';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import octopusConfig from 'config/octopus';
import { RegisterDelegatorModal } from 'components';
import { FAILED_TO_REDIRECT_MESSAGE, COMPLEX_CALL_GAS } from 'config/constants';

const NoValidators = () => (
  <Box p={3} borderRadius={10}  w="100%">
    <Flex color="gray" flexDirection="column" justifyContent="center" alignItems="center">
      <InfoOutlineIcon w={5} h={5} color="gray.400" />
      <Text mt={2} fontSize="xs">No Validators</Text>
    </Flex>
  </Box>
);

export const ValidatorsTable = ({ 
  anchor,
  noAction
}: {
  anchor: any;
  noAction?: boolean;
}) => {

  const toast = useToast();
  const [validatorList, setValidatorList] = useState<any>();
  const [selectedValidatorAccountId, setSelectedValidatorAccountId] = useState('');
  const [registerDelegatorModalOpen, setRegisterDelegatorModalOpen] = useBoolean(false);
  const [delegatedDeposits, setDelegatedDeposits] = useState([]);
  
  const [delegateAmount, setDelegateAmount] = useState<any>();
  const [delegateMorePopoverOpen, setDelegateMorePopoverOpen] = useBoolean(false);
  const [isDelegating, setIsDelegating] = useState(false);

  const initialFocusRef = React.useRef();
  const delegateAmountInputRef = React.useRef<any>();

  useEffect(() => {
    anchor
      .get_validator_list_of()
      .then(res => {
        setValidatorList(res);
      });
  }, [anchor]);

  useEffect(() => {
    if (delegateMorePopoverOpen) {
        setTimeout(() => {
          if (delegateAmountInputRef.current) {
            delegateAmountInputRef.current.focus();
          }
        }, 200);
    }
  }, [delegateMorePopoverOpen]);

  useEffect(() => {
    if (!validatorList?.length) {
      return;
    }
    Promise.all(
      validatorList.map(v => anchor.get_delegator_deposit_of({
        delegator_id: window.accountId,
        validator_id: v.validator_id
      }).then(amount => fromDecimals(amount)))
    ).then(deposits => {
      setDelegatedDeposits(deposits);
    });
  }, [validatorList, anchor]);

  const onRegisterDelegator = (id) => {
    setSelectedValidatorAccountId(id);
    setRegisterDelegatorModalOpen.on();
  }

  const onIncreaseDelegation = (id) => {
    setIsDelegating(true);
    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: anchor.contractId,
          amount: toDecimals(delegateAmount),
          msg: JSON.stringify({
            IncreaseDelegation: {
              validator_id: id
            }
          })
        },
        COMPLEX_CALL_GAS,
        1,
      ).catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsDelegating(false);
        console.log(err);
      });
  }

  return (
    <>
    <Skeleton isLoaded={validatorList !== undefined}>
    {
      validatorList?.length > 0 ?
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Validator Id</Th>
            <Th textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>Delegators</Th>
            <Th textAlign="center">Total Stake</Th>
            {
              noAction !== true ?
              <Th>Action</Th> : null
            }
          </Tr>
        </Thead>
        <Tbody>
          {
            validatorList.map((v, idx) => {
              const canDelegate = v.can_be_delegated_to && v.validator_id !== window.accountId;
              return (
                <Tr key={`validator-${idx}`}>
                  <Td>
                    <Link href={`${octopusConfig.explorerUrl}/accounts/${v.validator_id}`} isExternal>
                      {v.validator_id}
                    </Link>
                  </Td>
                  <Td textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>{v.delegators_count}</Td>
                  <Td>
                    <VStack spacing={0} justifyContent="flex-start">
                      <Text>{fromDecimals(v.total_stake)} OCT</Text>
                      <Text fontSize="xs" color="gray">Own: {fromDecimals(v.deposit_amount)}</Text>
                    </VStack>
                  </Td>
                  {
                    noAction !== true ?
                    <Td>
                      {
                        delegatedDeposits[idx] === undefined ?
                        <Spinner size="sm" /> :
                        delegatedDeposits[idx] > 0 ?
                        <Popover
                          initialFocusRef={initialFocusRef}
                          placement="bottom"
                          isOpen={delegateMorePopoverOpen}
                          onClose={setDelegateMorePopoverOpen.off}
                          >
                          <PopoverTrigger>
                            <Button size="xs" colorScheme="octoColor" onClick={setDelegateMorePopoverOpen.toggle}
                              isDisabled={delegateMorePopoverOpen || !canDelegate} variant="outline">Delegate more</Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <PopoverBody>
                              <Flex p={2}>
                                <Input placeholder="amount of OCT" ref={delegateAmountInputRef} onChange={e => setDelegateAmount(e.target.value)} />
                              </Flex>
                            </PopoverBody>
                            <PopoverFooter d="flex" justifyContent="flex-end">
                              <HStack spacing={3}>
                                {/* <Button size="sm" onClick={setDelegateMorePopoverOpen.off}>Cancel</Button> */}
                                <Button size="sm" onClick={() => onIncreaseDelegation(v.validator_id)} colorScheme="octoColor" 
                                  isLoading={isDelegating} isDisabled={isDelegating}>Delegate</Button>
                              </HStack>
                            </PopoverFooter>
                          </PopoverContent>
                        </Popover> :
                        <Button size="xs" colorScheme="octoColor" variant="outline" onClick={() => onRegisterDelegator(v.validator_id)}
                          isDisabled={!canDelegate}>Delegate</Button>
                      }
                    </Td> : false
                  }
                </Tr>
              )
            })
          }
        </Tbody>
      </Table> :
      <NoValidators />
    }
    </Skeleton>
    <RegisterDelegatorModal isOpen={registerDelegatorModalOpen} anchor={anchor} validatorAccountId={selectedValidatorAccountId}
      onClose={setRegisterDelegatorModalOpen.off} />
    </>
  );
}
