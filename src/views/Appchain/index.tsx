import React, { useEffect, useState } from 'react';

import {
  Container,
  Box,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  HStack,
  Wrap,
  WrapItem,
  Text,
  Avatar,
  Button,
  Icon,
  Link
} from '@chakra-ui/react';

import { 
  AiOutlineUser, 
  AiOutlineGlobal, 
  AiFillGithub, 
  AiOutlineFileZip 
} from 'react-icons/ai';

import { 
  AppchainInfo, 
  OriginAppchainInfo, 
  AnchorContract,
  OriginAppchainSettings,
  AppchainSettings
} from 'types';

import { useParams } from 'react-router-dom';
import BN from 'bn.js';
import { DecimalUtils } from 'utils';
import { ExternalLinkIcon, AttachmentIcon } from '@chakra-ui/icons';
import { StateBadge } from 'components';

import { useGlobalStore } from 'stores';

export const Appchain: React.FC = () => {
  const { id } = useParams();

  const [appchainInfo, setAppchainInfo] = useState<AppchainInfo>();
  const [anchorContract, setAnchorContract] = useState<AnchorContract>();

  const [appchainSettings, setAppchainSettings] = useState<AppchainSettings>();
  const globalStore = useGlobalStore(state => state.globalStore);

  useEffect(() => {

    globalStore
      .registryContract
      .get_appchain_status_of({
        appchain_id: id
      })
      .then(({
        appchain_anchor,
        appchain_id,
        appchain_owner,
        appchain_state,
        go_live_time,
        registered_time,
        validator_count,
        downvote_deposit,
        register_deposit,
        total_stake,
        upvote_deposit,
        voting_score,
        appchain_metadata 
      }) => {

        setAppchainInfo({
          appchainAnchor: appchain_anchor,
          appchainId: appchain_id,
          appchainOwner: appchain_owner,
          appchainState: appchain_state,
          validatorCount: validator_count,
          goLiveTime: go_live_time,
          registeredTime: registered_time,
          downvoteDeposit: new BN(downvote_deposit),
          registerDeposit: new BN(register_deposit),
          totalStake: new BN(total_stake),
          upvoteDeposit: new BN(upvote_deposit),
          votingScore: new BN(voting_score),
          appchainMetadata: {
            contactEmail: appchain_metadata.contact_email,
            customMetadata: appchain_metadata.custom_metadata,
            functionSpecUrl: appchain_metadata.function_spec_url,
            fungibleTokenMetadata: appchain_metadata.fungible_token_metadata,
            githubAddress: appchain_metadata.github_address,
            githubRelease: appchain_metadata.github_release,
            idoAmountOfWrappedAppchainToken: new BN(appchain_metadata.ido_amount_of_wrapped_appchain_token),
            initialEraReward: new BN(appchain_metadata.initial_era_reward),
            preminedWrappedAppchainToken: new BN(appchain_metadata.premined_wrapped_appchain_token),
            preminedWrappedAppchainTokenBeneficiary: appchain_metadata.premined_wrapped_appchain_token_beneficiary,
            websiteUrl: appchain_metadata.website_url
          }
        });

        if (appchain_anchor) {
          const contract = new AnchorContract(
            globalStore.walletConnection.account(),
            appchain_anchor,
            {
              viewMethods: [
                'get_appchain_settings',
                'get_validator_deposit_of',
                'get_anchor_status',
                'get_processing_status_of',
                'get_unbonded_stakes_of',
                'get_anchor_settings',
                'get_protocol_settings',
                'get_validator_set_info_of',
                'get_validator_list_of',
                'get_delegator_deposit_of'
              ],
              changeMethods: [
                'unbond_stake',
                'go_booting',
                'go_live',
                'set_rpc_endpoint',
                'set_subql_endpoint',
                'set_era_reward'
              ]
            }
          );

          setAnchorContract(contract);
        }
      });

  }, [id]);

  useEffect(() => {
    if (!anchorContract) {
      return;
    }

    anchorContract
      .get_appchain_settings()
      .then(({ rpc_endpoint, era_reward, subql_endpoint }) => {
        setAppchainSettings({
          rpcEndpoint: rpc_endpoint,
          eraReward: new BN(era_reward),
          subqlEndpoint: subql_endpoint
        });
      });
  }, [anchorContract]);

  return (
    <Container mt={6} mb={6}>
      <Box>
        <Breadcrumb fontSize="sm">
          <BreadcrumbItem color="gray">
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem color="gray">
            <BreadcrumbLink href="/appchains">Appchains</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">{id}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      <Flex mt={6} justifyContent="space-between" alignItems="flex-start">
        <Box>
          <HStack spacing={3}>
            <Avatar 
              size="sm"
              src={appchainInfo?.appchainMetadata.fungibleTokenMetadata?.icon} 
              name={appchainInfo?.appchainId}
              bg={appchainInfo?.appchainMetadata.fungibleTokenMetadata?.icon ? 'transparent' : 'blue.100'} />
            <Heading fontSize="3xl">{appchainInfo?.appchainId}</Heading>
            <StateBadge state={appchainInfo?.appchainState} />
          </HStack>
          <Wrap mt={6}>
            <WrapItem>
              <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.websiteUrl}>
                <HStack>
                  <Icon as={AiOutlineGlobal} />
                  <Text fontSize="xs">Website</Text>
                  <ExternalLinkIcon color="gray" />
                </HStack>
              </Button>
            </WrapItem>
            <WrapItem>
              <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.githubAddress}>
                <HStack>
                  <Icon as={AiFillGithub} />
                  <Text fontSize="xs">Github</Text>
                  <ExternalLinkIcon color="gray" />
                </HStack>
              </Button>
            </WrapItem>
            <WrapItem>
              <Button size="sm" as={Link} isExternal href={appchainInfo?.appchainMetadata.functionSpecUrl}>
                <HStack>
                  <Icon as={AttachmentIcon} />
                  <Text fontSize="xs">Function Spec</Text>
                  <ExternalLinkIcon color="gray" />
                </HStack>
              </Button>
            </WrapItem>
          </Wrap>
        </Box>
        <HStack>
          <Button>Staking</Button>
        </HStack>
      </Flex>
    </Container>
  );
}
