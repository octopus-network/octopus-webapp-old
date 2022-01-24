import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Tag
} from '@chakra-ui/react';

import { AnchorContract, OriginStakingHistory } from 'types';
import { useGlobalStore } from 'stores';
import { DecimalUtils } from 'utils';
import { OCT_TOKEN_DECIMALS } from 'primitives';

type HistoriesModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  anchorContract: AnchorContract;
}

export const HistoriesModal: React.FC<HistoriesModalProps> = ({
  isOpen,
  onClose,
  anchorContract
}) => {

  const globalStore = useGlobalStore(state => state.globalStore);
  const [histories, setHistories] = useState<OriginStakingHistory[]>();

  useEffect(() => {
    if (!anchorContract || !globalStore.accountId) {
      return;
    }

    anchorContract.get_user_staking_histories_of({
      account_id: globalStore.accountId
    }).then(histories => {
     
      setHistories(histories);
    });
    
  }, [globalStore, anchorContract]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent maxWidth="3xl">
        <ModalHeader>Staking Histories</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Action</Th>
                <Th>Amount</Th>
                <Th>Effected</Th>
                <Th>Time</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                histories?.map((history, idx) => {
                  let label = 'Unknown', amount = '0';

                  if (history.staking_fact.DelegationDecreased) {
                    label = 'Decrease Delegation';
                    amount = history.staking_fact.DelegationDecreased.amount;
                  } else if (history.staking_fact.DelegationIncreased) {
                    label = 'Increase Delegation';
                    amount = history.staking_fact.DelegationIncreased.amount;
                  } else if (history.staking_fact.DelegatorRegistered) {
                    label = 'Register Delegator';
                    amount = history.staking_fact.DelegatorRegistered.amount;
                  } else if (history.staking_fact.StakeDecreased) {
                    label = 'Decrease Stake';
                    amount = history.staking_fact.StakeDecreased.amount;
                  } else if (history.staking_fact.StakeIncreased) {
                    label = 'Increase Stake';
                    amount = history.staking_fact.StakeIncreased.amount;
                  } else if (history.staking_fact.ValidatorRegistered) {
                    label = 'Register Validator';
                    amount = history.staking_fact.ValidatorRegistered.amount;
                  } else if (history.staking_fact.ValidatorDelegationEnabled) {
                    label = 'Enable Delegation';
                  }

                  return (
                    <Tr key={idx}>
                      <Td>
                        <Tag>{label}</Tag>
                      </Td>
                      <Td>
                        { DecimalUtils.beautify(DecimalUtils.fromString(amount, OCT_TOKEN_DECIMALS)) } OCT
                      </Td>
                      <Td>
                        {
                          history.has_taken_effect ? 'Yes' : 'No'
                        }
                      </Td>
                      <Td>{dayjs(Math.floor(history.timestamp/1e6)).format('YYYY-MM-DD HH:mm:ss')}</Td>
                    </Tr>
                  );
                })
              }
              
            </Tbody>
          </Table>
        </ModalBody>
        <Box pb={4} />
      </ModalContent>
    </Modal>
  );
}