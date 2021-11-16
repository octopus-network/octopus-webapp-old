import { SubstrateImage } from 'types';

export const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';
export const rpcEndpoint = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

export const baseImages: SubstrateImage[] = [
  {
    image: 'gcr.io/octopus-dev-309403/substrate-octopus@sha256:5b4694fa7bf522fee76ecd607a76e312b19757005977de4c7c0c2c9869e31934',
    label: 'Substrate 0.9.8'
  }
]