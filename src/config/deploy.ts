import { SubstrateImage } from 'types';

export const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';
export const rpcEndpoint = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

export const baseImages: SubstrateImage[] = [
  {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/barnacle:latest',
    label: 'barnacle:latest'
  },
  {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node:latest',
    label: 'debio-node:latest'
  }
]