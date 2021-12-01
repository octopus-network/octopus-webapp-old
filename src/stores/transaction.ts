import create from 'zustand';
import { Transaction } from 'types';

import { octopusConfig } from 'config';

type TransactionStore = {
  transactions: Record<string, Transaction>;
  appendTxn: (transaction: Transaction) => void;
  updateTxn: (hash: string, obj: any) => void;
  clearTxns: () => void;
}

const localTxnsObj = window.localStorage.getItem('transactions');

const storeTxns = (txns) => {
  window.localStorage.setItem(
    'transactions', 
    JSON.stringify(Object.assign(localTxnsObj ? JSON.parse(localTxnsObj) : {}, {
      [octopusConfig.networkId]: txns
    }))
  );
}

export const useTransactionStore = create((set: any, get: any): TransactionStore => ({
  transactions: localTxnsObj ? JSON.parse(localTxnsObj)[octopusConfig.networkId] || {} : {},
  appendTxn: (transaction: Transaction) => {
    set((state: any) => ({ 
      transactions: { ...state.transactions, [transaction.hash]: transaction } 
    }));

    const txns = get().transactions;
    storeTxns(txns);
  },
  updateTxn: (hash: string, obj: any) => {
    set((state: any) => ({ 
      transactions: { ...state.transactions, [hash]: {...state.transactions[hash], ...obj}} 
    }));
    const txns = get().transactions;
    storeTxns(txns);
  },
  clearTxns: () => {
    set({ transactions: {} });
    window.localStorage.setItem(
      'transactions', 
      JSON.stringify(Object.assign(localTxnsObj ? JSON.parse(localTxnsObj) : {}, {
        [octopusConfig.networkId]: null
      }))
    );
  }
}));