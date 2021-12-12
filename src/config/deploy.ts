import { SubstrateImage } from 'types';

export const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';
export const rpcEndpoint = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

export const regions = [{
  label: 'Random',
  value: ''
}, {
  label: 'Asia Pacific',
  value: 'ap',
}, {
  label: 'Europe',
  value: 'eu',
}, {
  label: 'United States',
  value: 'us',
}];

export const baseImages: Record<string, SubstrateImage> = {
  'default': {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/barnacle:latest',
    label: 'barnacle:latest'
  },
  'barnacle': {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/barnacle:latest',
    label: 'barnacle:latest'
  },
  'debionetwork': {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node@sha256:e2de249c3126bb6930851e6e7fcc6053519d60580c5a9e52a0759cbb6fa1032f',
    label: 'debio-node:latest',
    chain: 'octopus-mainnet'
  },
  'uchain': {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node@sha256:df986cca952f2d8edc1bc24b439a06d20eff2bdb92411dc139e4de058cb525e4',
    label: 'uchain:latest',
    chain: 'octopus-mainnet'
  }
}
