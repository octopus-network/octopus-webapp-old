import octopusConfig from 'config/octopus';

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