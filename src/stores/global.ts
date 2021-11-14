import create from 'zustand';

import { GlobalStore } from 'types';

type GlobalStoreComponent = {
  globalStore: GlobalStore;
  updateGlobalStore: (store: GlobalStore) => void;

}

export const useGlobalStore = create((set: any, get: any): GlobalStoreComponent => ({
  globalStore: {
    walletConnection: null,
    registryContract: null,
    tokenContract: null,
    accountId: null,
    pjsAccount: null
  },
  updateGlobalStore: (store: GlobalStore) => {
    set({ globalStore: store });
  }
}));