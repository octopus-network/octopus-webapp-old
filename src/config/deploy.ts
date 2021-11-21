import { SubstrateImage } from 'types';

export const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';
export const rpcEndpoint = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

export const baseImages: SubstrateImage[] = [
  {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/barnacle@sha256:67454e34ea36ff7deae445b5f82e04e00c3227e553909c6d4cb1478bd838fd5a',
    label: 'Barnacle v0.9.12-alpha.3'
  }
]
