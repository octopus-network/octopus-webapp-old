import { BigNumber } from 'bignumber.js';

export const FAILED_TO_REDIRECT_MESSAGE = 'Failed to redirect to sign transaction';

export const T_GAS: BigNumber = new BigNumber(1).times(10 ** 12);
export const SIMPLE_CALL_GAS = T_GAS.times(50).toFixed();
export const COMPLEX_CALL_GAS = T_GAS.times(150).toFixed();

export const OCT_TOKEN_DECIMALS = 18;