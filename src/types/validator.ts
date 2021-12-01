import Decimal from 'decimal.js';

import {
  AccountId 
} from 'types';

export type OriginAppchainValidator = {
  validator_id: string;
  validator_id_in_appchain: string;
  deposit_amount: string;
  total_stake: string;
  delegators_count: string;
  can_be_delegated_to: boolean;
}

export type AppchainValidator = {
  validatorId: AccountId;
  validatorIdInAppchain: string;
  depositAmount: Decimal;
  totalStake: Decimal;
  delegatorsCount: number;
  canBeDelegatedTo: boolean;
}

export type ValidatorProfile = {
  socialMediaHandle: string;
  validatorId: string;
  email: string;
}