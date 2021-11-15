const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'testnet';
const REGISTRY_CONTRACT = process.env.REACT_APP_OCT_REGISTRY_CONTRACT || 'dev-oct-registry.testnet';
const TOKEN_CONTRACT = process.env.REACT_APP_OCT_TOKEN_CONTRACT || 'oct.beta_oct_relay.testnet';

export const octopusConfig = {
  networkId: NETWORK,
  nodeUrl: `https://rpc.${NETWORK}.near.org`,
  archivalUrl: `https://archival-rpc.${NETWORK}.near.org`,
  registryContractId: REGISTRY_CONTRACT,
  tokenContractId: TOKEN_CONTRACT,
  walletUrl: `https://wallet.${NETWORK}.near.org`,
  helperUrl: `https://helper.${NETWORK}.near.org`,
  explorerUrl: `https://explorer.${NETWORK}.near.org`
};
