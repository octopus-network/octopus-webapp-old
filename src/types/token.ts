export type OriginFungibleTokenMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  referenceHash: string | null;
  decimals: number;
}

export type FungibleTokenMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  referenceHash: string | null;
  decimals: number;
}

export type StorageDeposit = {
  total: string;
  available: string;
}

export type TokenAsset = {
  symbol: string;
  logoUri: string;
  contractId: string;
  assetId?: number;
  decimals: number;
}