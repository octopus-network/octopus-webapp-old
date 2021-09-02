import { BigNumber } from 'bignumber.js';

export const FAILED_TO_REDIRECT_MESSAGE = 'Failed to redirect to sign transaction';

export const BOATLOAD_OF_GAS = new BigNumber(3).times(10 ** 14).toFixed();