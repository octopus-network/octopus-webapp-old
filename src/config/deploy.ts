import { SubstrateImage } from 'types';

export const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';
export const rpcEndpoint = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

export const baseImages: SubstrateImage[] = [
  {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/barnacle@sha256:3676ff8f9cee2b398345883b286795ada6ae8afa78691ccc653eaa262cbda251',
    label: 'Barnacle v0.9.12-alpha.2'
  }
]