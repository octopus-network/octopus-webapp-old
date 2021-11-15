import React from 'react';

import {
  HStack,
  Button,
  IconButton,
  Text,
  Icon
} from '@chakra-ui/react';

import { 
  MdKeyboardArrowLeft, 
  MdKeyboardArrowRight 
} from 'react-icons/md';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onChange: Function;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onChange }) => {
 
  const totalPage = Math.ceil(total/pageSize);
  const onFirstPage = () => onChange(1);
  const onLastPage = () => onChange(totalPage);
  const onPrevPage = () => onChange(page - 1);
  const onNextPage = () => onChange(page + 1);

  return (
    <HStack>
      <Button size="sm" disabled={page <= 1 || totalPage <= 1} onClick={onFirstPage}>First</Button>
      <IconButton aria-label="prev-page" size="sm" disabled={page <= 1 || totalPage <= 1} onClick={onPrevPage}>
        <Icon as={MdKeyboardArrowLeft} w={5} h={5} />
      </IconButton>
      <Text fontSize="sm">Page {page} of {Math.ceil(total/pageSize)}</Text>
      <IconButton aria-label="next-page" size="sm" disabled={page >= totalPage} onClick={onNextPage}>
        <Icon as={MdKeyboardArrowRight} w={5} h={5} />
      </IconButton>
      <Button size="sm" disabled={page >= totalPage} onClick={onLastPage}>Last</Button>
    </HStack>
  );
}
