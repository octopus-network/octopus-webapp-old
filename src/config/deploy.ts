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
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node@sha256:680d8d2c2cae49c0853aa401571b18e70eda6378d6702b21b83647cca8d93294',
    label: 'debio-node:latest'
  },
  'uchain': {
    image: 'us-central1-docker.pkg.dev/octopus-prod/octopus-appchains/debio-node@sha256:df986cca952f2d8edc1bc24b439a06d20eff2bdb92411dc139e4de058cb525e4',
    label: 'uchain:latest',
    chain: 'octopus-mainnet'
  }
}
