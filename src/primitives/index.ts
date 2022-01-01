import { BigNumber } from 'bignumber.js';

export const FAILED_TO_REDIRECT_MESSAGE = 'Failed to redirect to sign transaction';

const T_GAS: BigNumber = new BigNumber(1).times(10 ** 12);

export const Gas = {
  SIMPLE_CALL_GAS: T_GAS.times(50).toFixed(),
  COMPLEX_CALL_GAS: T_GAS.times(150).toFixed()
}

export const OCT_TOKEN_DECIMALS = 18;

export const EPOCH_DURATION_MS = 24 * 3600 * 1000;