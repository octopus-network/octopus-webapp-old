import { BigNumber } from 'bignumber.js';

import octopusConfig from 'config/octopus';

export function fromDecimals(numStr, decimals = 18) {
  return new BigNumber(numStr).div(Math.pow(10, decimals)).toNumber();
}

export function toDecimals(num, decimals = 18) {
  return new BigNumber(num).multipliedBy(10 ** decimals).toString(10);
}

export function readableAppchain(appchain) {
  return Object.assign(appchain, {
    bond_tokens: fromDecimals(appchain.bond_tokens),
    validators: appchain.validators.map((v) =>
      Object.assign(v, { staked_amount: fromDecimals(v.staked_amount) })
    ),
  });
}

export function readableAppchains(appchains) {
  return appchains.map((ac) => readableAppchain(ac));
}

export function logoutNear() {
  window.walletConnection.signOut();
  // reload page
  window.location.replace(window.location.origin + window.location.pathname);
}

export function loginNear() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(
    octopusConfig.registryContractId,
    "Octopus Webapp"
  );
}


export const appchainStates = {
  'Registered': 'Pre-Audit',
  'Dead': 'Pre-Audit',
  'Auditing': 'Auditing',
  'InQueue': 'Voting',
  'Staging': 'Staking',
  'Booting': 'Booting',
  'Active': 'Running'
}