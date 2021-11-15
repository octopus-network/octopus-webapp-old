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