import { FungibleTokenMetadata, AccountId, Time } from 'types';

import BN from 'bn.js';

export type AppchainId = string;

export enum AppchainState {
  Registered = 'Registered',
  Auditing = 'Auditing',
  Dead = 'Dead',
  InQueue = 'InQueue',
  Staging = 'Staging',
  Booting = 'Booting',
  Active = 'Active'
}

export enum AppchainSortingField {
  VotingScore = 'VotingScore',
  RegisteredTime = 'RegisteredTime',
}

export enum AppchainSortingOrder {
  Descending = 'Descending',
}

export type AppchainMetadata = {
  contactEmail: string;
  customMetadata: Record<string, any>;
  functionSpecUrl: string;
  fungibleTokenMetadata: FungibleTokenMetadata;
  githubAddress: string;
  githubRelease: string;
  idoAmountOfWrappedAppchainToken: BN;
  initialEraReward: BN;
  preminedWrappedAppchainToken: BN;
  preminedWrappedAppchainTokenBeneficiary: AccountId;
  websiteUrl: string;
}

export type OriginAppchainInfo = {
  appchain_anchor: AccountId;
  appchain_id: AppchainId;
  appchain_metadata: {
    contact_email: string;
    custom_metadata: Record<string, any>;
    function_spec_url: string;
    fungible_token_metadata: FungibleTokenMetadata;
    github_address: string;
    github_release: string;
    ido_amount_of_wrapped_appchain_token: string;
    initial_era_reward: string;
    premined_wrapped_appchain_token: string;
    premined_wrapped_appchain_token_beneficiary: AccountId;
    website_url: string;
  },
  appchain_owner: string;
  appchain_state: AppchainState;
  downvote_deposit: string;
  go_live_time: Time;
  register_deposit: string;
  registered_time: string;
  total_stake: string;
  upvote_deposit: string;
  validator_count: number;
  voting_score: string;
}

export type AppchainInfo = {
  appchainAnchor: AccountId;
  appchainId: AppchainId;
  appchainMetadata: AppchainMetadata;
  appchainOwner: AccountId;
  appchainState: AppchainState;
  downvoteDeposit: BN;
  goLiveTime: Time;
  registerDeposit: BN;
  registeredTime: Time;
  totalStake: BN;
  upvoteDeposit: BN;
  validatorCount: number;
  votingScore: BN;
}

export type OriginAppchainSettings = {
  rpc_endpoint: string;
  subql_endpoint: string;
  era_reward: string;
}

export type AppchainSettings = {
  rpcEndpoint: string;
  subqlEndpoint: string;
  eraReward: BN;
}