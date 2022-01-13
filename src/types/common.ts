import { RegistryContract, TokenContract } from 'types';
import { WalletConnection } from 'near-api-js';

export type AccountId = string;
export type Time = string;

export type GlobalStore = {
  walletConnection: WalletConnection;
  accountId: AccountId;
  pjsAccount: any;
  tokenContract: TokenContract;
  registryContract: RegistryContract;
}

export type Transaction = {
  hash: string;
  status: 'success'|'error'|'loading';
  message: string;
  summary: string;
  addedTime: number;
  notificationIndex?: number;
  sequenceId?: number;
  from: string;
  appchainId: string;
}

export type Message = {
  duration?: number;
  doNotAutoRemove?: boolean;
  title: string;
  description: string;
  status: 'success'|'error'|'info'|'loading';
  link?: string;
}