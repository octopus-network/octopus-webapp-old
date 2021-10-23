import React, { useEffect } from 'react';

import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';

export const ValidatorsTable = ({ anchor }) => {

  useEffect(() => {
    anchor
      .get_processing_status_of({ era_number: '0' })
      .then(res => {
        console.log(res);
      });

    anchor
      .get_anchor_status()
      .then(status => {
        console.log(status);
      });

    anchor
      .get_validator_list_of_era({
        era_number: '0'
      })
      .then(res => {
        console.log(res);
      });
  }, [anchor]);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Validator Id</Th>
          <Th isNumeric>staked amount</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td></Td>
          <Td></Td>
        </Tr>
      </Tbody>
    </Table>
  );
}
