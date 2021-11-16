import React, { useEffect, useState, useRef } from 'react';
import { ApiPromise } from '@polkadot/api';

import {
  Table,
  TableProps,
  Thead,
  Tr,
  Th,
  Tbody,
  Flex,
  Td,
  Link,
  Skeleton,
  useBoolean,
  Wrap,
  WrapItem,
  Heading,
  Text,
  Tag
} from '@chakra-ui/react';

import { Pagination } from 'components';
import { GenericExtrinsic } from '@polkadot/types';

type BlocksTableProps = TableProps & {
  apiPromise: ApiPromise;
  bestNumber: number;
}

type BlockData = {
  number: number;
  hash: string;
  extrinsics: GenericExtrinsic[];
}

async function getHeaderByBlockNumber(api: ApiPromise, num: number): Promise<BlockData> {
  if (!api.isReady || !api.isConnected) {
    return Promise.resolve(null);
  }
  return api.rpc.chain.getBlockHash(num)
    .then(hash => Promise.all([
      api.rpc.chain.getBlock(hash),
      api.derive.chain.getHeader(hash)
    ])).then(([block, header]) => {
      const json = header.toJSON();
      return {
        number: json.number as number,
        hash: header.hash.toString(),
        extrinsics: block.block.extrinsics
      }
    });
}

export const BlocksTable: React.FC<BlocksTableProps> = ({ apiPromise, bestNumber, ...props }) => {

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const isMounted = useRef<boolean>(false);
  const [isPaused, setIsPaused] = useBoolean(false);

  const [blockDataList, setBlockDataList] = useState<BlockData[]>();

  useEffect(() => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (bestNumber < 1 || !apiPromise?.isReady || isPaused) {
      return;
    }

    let blockStart = bestNumber - pageSize * (page - 1);
    let blockEnd = bestNumber - pageSize * page + 1;
    blockEnd = blockEnd < 1 ? 1 : blockEnd;

    const promises = [];
    for (let i = blockStart; i >= blockEnd; i--) {
      promises.push(getHeaderByBlockNumber(apiPromise, i));
    }

    Promise.all(promises).then(list => {
      setBlockDataList(list);
    });

  }, [bestNumber, page, pageSize, apiPromise, isPaused]);

  return (
    <Skeleton isLoaded={blockDataList?.length > 0}>
    <Table variant="simple" {...props} 
      onMouseEnter={setIsPaused.on}
      onMouseLeave={setIsPaused.off}>
      <Thead>
        <Tr>
          <Th>Block</Th>
          <Th display={{ base: 'none', lg: 'table-cell' }}>Hash</Th>
          <Th>Extrinsics</Th>
        </Tr>
      </Thead>
      
      <Tbody>
        {
          blockDataList?.filter(b => !!b).map(({ number, hash, extrinsics }, idx) => {
            return (
              <Tr key={`block-${idx}`}>
                <Td>
                  <Heading fontSize="sm">
                    #{number}
                  </Heading>
                </Td>
                <Td display={{ base: 'none', lg: 'table-cell' }}>
                  <Link href="#"
                    _hover={{ textDecoration: 'underline' }}>
                    <Text fontSize="sm">{hash}</Text>
                  </Link>
                </Td>
                <Td>
                  <Wrap>
                  {
                    extrinsics.map((extrinc, idx) => {
                      const { method, section } = extrinc.registry.findMetaCall(extrinc.callIndex);
                      return (
                        <WrapItem key={`extrinsic-${idx}`}>
                          <Tag size="sm">
                            {method}.{section}
                          </Tag>
                        </WrapItem>
                      );
                    })
                  }
                  </Wrap>
                </Td>
              </Tr>
            );
          })
        }
      </Tbody>
    </Table>
    {
      bestNumber > pageSize ?
        <Flex justifyContent="flex-end" mt={4}>
          <Pagination
            page={page}
            total={bestNumber}
            pageSize={pageSize}
            onChange={(p: number) => setPage(p)} />
        </Flex> : null
    }
    </Skeleton>
  );
}