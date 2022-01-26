import { Contract } from 'near-api-js';

import { 
  OriginAppchainSettings, 
  OriginAppchainInfo, 
  AccountId,
  AppchainState,
  AppchainSortingField,
  AppchainSortingOrder,
  AppchainId,
  FungibleTokenMetadata,
  OriginIndexRange,
  OriginRewardHistory,
  OriginWrappedAppchainToken,
  StorageDeposit,
  OriginUnbondedHistory,
  OriginStakingHistory,
  OriginAppchainValidator,
  Delegator
} from 'types';

type FtBalanceOfArgs = {
  account_id: AccountId
}

type StorageBalanceOfArgs = FtBalanceOfArgs;

type FtTransferCallArgs = {
  receiver_id: AccountId;
  amount: string;
  msg: string;
}

type GetAppchainStatusOfArgs = {
  appchain_id: string;
}

type GetAppchainsCountOfArgs = {
  appchain_state: AppchainState;
}

type GetAppchainsWithStateOfArgs = {
  appchain_state: AppchainState[];
  page_number: number;
  page_size: number;
  sorting_field: AppchainSortingField;
  sorting_order: AppchainSortingOrder;
}

type UpdateAppchainMetadataArgs = {
  appchain_id: AppchainId;
  website_url: string;
  function_spec_url: string;
  github_adderss: string;
  contact_email: string;
  premined_wrapped_appchain_token_beneficiary: AccountId;
  premined_wrapped_appchain_token: string;
  ido_amount_of_wrapped_appchain_token: string;
  initial_era_reward: string;
  fungible_token_metadata: FungibleTokenMetadata;
  custom_metadata: Record<string, string>;
}

type GetDepositForArgs = {
  appchain_id: AppchainId;
  account_id: AccountId;
}

type WithdrawDepositOfArgs = {
  appchain_id: AppchainId;
  amount: string;
}

type RejectAppchainArgs = {
  appchain_id: AppchainId;
}

type RemoveAppchainArgs = RejectAppchainArgs;

type PassAuditignAppchainArgs = RejectAppchainArgs;

type StartAuditingAppchainArgs = RejectAppchainArgs;

type GetValidatorDepositOfArgs = {
  validator_id: AccountId;
}

type GetUnBondedStakesOfArgs = {
  account_id: AccountId;
}

type GetDelegatorDepositOfArgs = {
  delegator_id: AccountId;
  validator_id: AccountId;
}

type SetRpcEndpointProps = {
  rpc_endpoint: string;
}

type SetSubqlEndpointProps = {
  subql_endpoint: string;
}

type SetEraRewardProps = {
  era_reward: string;
}

type GetValidatorRewardsOfArgs = {
  start_era: string;
  end_era: string;
  validator_id: AccountId;
}

type WtidrawValidatorRewardsArgs = {
  validator_id: AccountId;
}

type WtidrawDelegatorRewardsArgs = {
  delegator_id: AccountId;
  validator_id: AccountId;
}

type BurnWrappedAppchainTokenArgs = {
  receiver_id: string;
  amount: string;
}

type WithdrawStakeArgs = {
  account_id: string;
}

type DecreaseStakeArgs = {
  amount: string;
}

type GetDelegatorRewardsOfArgs = {
  start_era: string;
  end_era: string;
  delegator_id: AccountId;
  validator_id: AccountId;
}

type DecreaseDelegationArgs = {
  validator_id: string;
  amount: string;
}

type GetUserStakingHistoriesOfArgs = {
  account_id: string; 
}

type GetAppchainNotificationHistoryArgs = {
  index: string;
}

type GetDelegatorsOfValidatorInEra = {
  era_number?: string;
  validator_id: string;
}

type GetAppchainMessageProcessingResultOf = {
  nonce: number;
}

export class TokenContract extends Contract {
 
  ft_balance_of(args: FtBalanceOfArgs): Promise<string> {
    return this.ft_balance_of(args);
  };

  storage_balance_of(args: StorageBalanceOfArgs): Promise<StorageDeposit> {
    return this.storage_balance_of(args);
  };

  ft_transfer_call(args: FtTransferCallArgs, gas: string, deposit: number) {
    return this.ft_transfer_call(args, gas, deposit);
  };
}

export class RegistryContract extends Contract {

  get_appchain_status_of(args: GetAppchainStatusOfArgs): Promise<OriginAppchainInfo> {
    return this.get_appchain_status_of(args);
  }

  get_appchains_count_of(args?: GetAppchainsCountOfArgs): Promise<string> {
    return this.get_appchains_count_of();
  }

  get_total_stake(): Promise<string> {
    return this.get_total_stake();
  }

  get_appchains_with_state_of(args: GetAppchainsWithStateOfArgs): Promise<OriginAppchainInfo[]> {
    return this.get_appchains_with_state_of(args);
  }

  get_owner(): Promise<AccountId> {
    return this.get_owner();
  }

  get_registry_settings(): Promise<any> {
    return this.get_registry_settings();
  }

  get_upvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_upvote_deposit_for(args);
  }

  get_downvote_deposit_for(args: GetDepositForArgs): Promise<string> {
    return this.get_downvote_deposit_for(args);
  }

  count_voting_score(args = {}, gas: string) {
    return this.count_voting_score(args, gas);
  }

  conclude_voting_score(args = {}, gas: string) {
    return this.conclude_voting_score(args, gas);
  }

  update_appchain_metadata(args: UpdateAppchainMetadataArgs) {
    return this.update_appchain_metadata(args);
  }

  reject_appchain(args: RejectAppchainArgs, gas: string) {
    return this.reject_appchain(args, gas);
  }

  remove_appchain(args: RemoveAppchainArgs, gas: string) {
    return this.remove_appchain(args, gas);
  }

  pass_auditing_appchain(args: PassAuditignAppchainArgs, gas: string) {
    return this.pass_auditing_appchain(args, gas);
  }

  start_auditing_appchain(args: StartAuditingAppchainArgs, gas: string) {
    return this.start_auditing_appchain(args, gas);
  }

  withdraw_upvote_deposit_of(args: WithdrawDepositOfArgs, gas: string) {
    return this.withdraw_upvote_deposit_of(args, gas);
  }

  withdraw_downvote_deposit_of(args: WithdrawDepositOfArgs, gas: string) {
    return this.withdraw_downvote_deposit_of(args, gas);
  }
}

export class AnchorContract extends Contract {
  get_appchain_settings(): Promise<OriginAppchainSettings> {
    return this.get_appchain_settings();
  }

  get_anchor_status(): Promise<any> {
    return this.get_anchor_status();
  }

  get_index_range_of_staking_history(): Promise<OriginIndexRange> {
    return this.get_index_range_of_staking_history();
  }

  get_validator_rewards_of(args: GetValidatorRewardsOfArgs): Promise<OriginRewardHistory[]> {
    return this.get_validator_rewards_of(args);
  }

  get_delegator_rewards_of(args: GetDelegatorRewardsOfArgs): Promise<OriginRewardHistory[]> {
    return this.get_delegator_rewards_of(args);
  }

  enable_delegation(args: {}, gas: string) {
    return this.enable_delegation(args, gas);
  }

  disable_delegation(args: {}, gas: string) {
    return this.disable_delegation(args, gas);
  }

  get_validator_deposit_of(args: GetValidatorDepositOfArgs): Promise<string> {
    return this.get_validator_deposit_of(args);
  } 

  get_unbonded_stakes_of(args: GetUnBondedStakesOfArgs): Promise<OriginUnbondedHistory[]> {
    return this.get_unbonded_stakes_of(args);
  }

  unbond_stake(args: {}, gas: string) {
    return this.unbond_stake(args, gas);
  }

  unbond_delegation(args: {}, gas: string) {
    return this.unbond_delegation(args, gas);
  }

  get_protocol_settings(): Promise<any> {
    return this.get_protocol_settings();
  }

  get_validator_list_of(): Promise<OriginAppchainValidator[]> {
    return this.get_validator_list_of();
  }

  get_delegators_of_validator_in_era(args: GetDelegatorsOfValidatorInEra): Promise<Delegator[]> {
    return this.get_delegators_of_validator_in_era(args);
  }

  get_delegator_deposit_of(args: GetDelegatorDepositOfArgs): Promise<string> {
    return this.get_delegator_deposit_of(args);
  }

  go_booting(args: {}, gas: string) {
    return this.go_booting(args, gas);
  }

  set_rpc_endpoint(args: SetRpcEndpointProps, gas: string) {
    return this.set_rpc_endpoint(args, gas);
  }

  set_subql_endpoint(args: SetSubqlEndpointProps, gas: string) {
    return this.set_subql_endpoint(args, gas);
  }

  set_era_reward(args: SetEraRewardProps, gas: string) {
    return this.set_era_reward(args, gas);
  }

  go_live(args: {}, gas: string) {
    return this.go_live(args, gas);
  }

  withdraw_validator_rewards(args: WtidrawValidatorRewardsArgs, gas: string) {
    return this.withdraw_validator_rewards(args, gas);
  }

  withdraw_delegator_rewards(args: WtidrawDelegatorRewardsArgs, gas: string) {
    return this.withdraw_delegator_rewards(args, gas);
  }

  withdraw_stake(args: WithdrawStakeArgs, gas: string) {
    return this.withdraw_stake(args, gas);
  }

  decrease_stake(args: DecreaseStakeArgs, gas: string) {
    return this.decrease_stake(args, gas);
  }

  get_user_staking_histories_of(args: GetUserStakingHistoriesOfArgs): Promise<OriginStakingHistory[]> {
    return this.get_user_staking_histories_of(args);
  }

  get_appchain_notification_history(args: GetAppchainNotificationHistoryArgs): Promise<any> {
    return this.get_appchain_notification_history(args);
  }

  decrease_delegation(args: DecreaseDelegationArgs, gas: string) {
    return this.decrease_delegation(args, gas);
  }

  get_wrapped_appchain_token(): Promise<OriginWrappedAppchainToken> {
    return this.get_wrapped_appchain_token();
  }

  burn_wrapped_appchain_token(args: BurnWrappedAppchainTokenArgs, gas: string) {
    return this.burn_wrapped_appchain_token(args, gas);
  }

  get_appchain_message_processing_result_of(args: GetAppchainMessageProcessingResultOf) {
    return this.get_appchain_message_processing_result_of(args);
  }
}