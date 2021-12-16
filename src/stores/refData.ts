import create from 'zustand';

type RefDataStore = {
  refData: any;
  updateRefData: (data: any) => void;
}

export const useRefDataStore = create((set: any, get: any): RefDataStore => ({
  refData: null,
  updateRefData: (data: any) => {
    set({ refData: data });
  }
}));