import React, { useMemo } from 'react';

import {
  Input,
  InputProps
} from '@chakra-ui/react';

import { isNumber, beautify } from 'utils';

type AmountInputPropos = Omit<InputProps, 'onChange'|'value'> & {
  onChange: (value: string) => void;
  value: string;
}

export const AmountInput: React.FC<AmountInputPropos> = ({ onChange, value, ...props }) => {
 
  const _onChange = (e: React.BaseSyntheticEvent) => {
    const targetValue = e.target.value.replaceAll(',', '');
    if ( 
      (targetValue !== '' && !isNumber(targetValue)) ||
      targetValue * 1 > 1_000_000_000_000
    ) {
      e.target.value = value;
      return;
    }
  
    onChange(targetValue);
  }

  const beautifyValue = useMemo(() => beautify(value), [value]);

  return (
    <Input
      {...props}
      fontSize="2xl"
      fontWeight={600}
      type="text"
      variant="unstyled"
      value={beautifyValue}
      placeholder="0.00"
      inputMode="decimal"
      onChange={_onChange}
      style={{
        marginTop: 0
      }}
      _placeholder={{
        opacity: .9,
        color: 'gray'
      }}
      borderRadius={0}
    />
  );
}