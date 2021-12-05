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
  },
  {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node@sha256:df986cca952f2d8edc1bc24b439a06d20eff2bdb92411dc139e4de058cb525e4',
    label: 'uchain:latest'
  }
]