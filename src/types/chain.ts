import { 
  FungibleTokenMetadata, 
  OriginFungibleTokenMetadata,
  AccountId, 
  Time 
} from 'types';

import Decimal from 'decimal.js';

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
  idoAmountOfWrappedAppchainToken: Decimal;
  initialEraReward: Decimal;
  preminedWrappedAppchainToken: Decimal;
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
  downvoteDeposit: Decimal;
  goLiveTime: Time;
  registerDeposit: Decimal;
  registeredTime: Time;
  totalStake: Decimal;
  upvoteDeposit: Decimal;
  validatorCount: number;
  votingScore: Decimal;
}

export type OriginAppchainSettings = {
  rpc_endpoint: string;
  subql_endpoint: string;
  era_reward: string;
}

export type AppchainSettings = {
  rpcEndpoint: string;
  subqlEndpoint: string;
  eraReward: Decimal;
}

export type OriginIndexRange = {
  start_index: string;
  end_index: string;
}

export type IndexRange = {
  startIndex: number;
  endIndex: number;
}

export type OriginRewardHistory = {
  era_number: string;
  total_reward: string;
  unwithdrawn_reward: string;
}

export type StakingFact = {
  'StakeIncreased'?: {
    amount: string;
    validator_id: string;
  },
  'StakeDecreased'?: {
    amount: string;
    validator_id: string;
  },
  'DelegationIncreased'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'DelegationDecreased'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'DelegatorRegistered'?: {
    amount: string;
    delegator_id: string;
    validator_id: string;
  },
  'ValidatorRegistered'?: {
    amount: string;
    can_be_delegated_to: boolean;
    validator_id: string;
    validator_id_in_appchain: string;
  },
  'ValidatorDelegationEnabled'?: {
    validator_id: string;
  },
  'ValidatorDelegationDisabled'?: {
    validator_id: string;
  },
  'ValidatorUnbonded'?: {
    validator_id: string;
    amount: string;
  },
  'DelegatorUnbonded'?: {
    validator_id: string;
    delegator_id: string;
    amount: string;
  }
}

export type OriginStakingHistory = {
  block_height: number;
  has_taken_effect: boolean;
  staking_fact: StakingFact;
  timestamp: number;
}

export type Delegator = {
  delegator_id: string;
  delegation_amount: string;
  validator_id: string;
}

export type RewardHistory = {
  eraNumber: number;
  total_reward: Decimal;
  unwithdrawn_reward: Decimal;
}

export type OriginUnbondedHistory = {
  era_number: string;
  amount: string;
  unlock_time: string;
}

export type UnbondedHistory = {
  eraNumber: number;
  amount: Decimal;
  unlockTime: number;
}

export type OriginWrappedAppchainToken = {
  metadata: OriginFungibleTokenMetadata;
  contract_account: AccountId;
  premined_beneficiary: AccountId;
  premined_balance: string;
  changed_balance: string;
  price_in_usd: string;
}
