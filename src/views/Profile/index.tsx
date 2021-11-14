import React, { useEffect, useState, useMemo } from 'react';

import {
  Container,
  Flex,
  HStack,
  Icon,
  Heading,
  Box,
  Divider,
  IconButton,
  Text,
  useClipboard,
  VStack,
  Button,
  useBoolean,
  Input,
  Link,
  useToast,
  Spinner
} from '@chakra-ui/react';

import { Contract } from 'near-api-js';
import { useParams } from 'react-router-dom';
import { CgProfile } from 'react-icons/cg';
import { CheckIcon, CopyIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { utils } from 'near-api-js';
import { DecimalUtils, ZERO_DECIMAL } from 'utils';
import { ValidatorProfile } from 'types';
import { octopusConfig } from 'config';
import { FAILED_TO_REDIRECT_MESSAGE, OCT_TOKEN_DECIMALS } from 'primitives';
import { encodeAddress } from '@polkadot/util-crypto';
import Decimal from 'decimal.js';
import { useGlobalStore } from 'stores';

export const Profile: React.FC = () => {
  const { id } = useParams();

  const toast = useToast();
  const account = useMemo(() => id.split('@')[0], [id]);
  const appchainId = useMemo(() => id.split('@')[1], [id]);
  const globalStore = useGlobalStore(state => state.globalStore);

  const { hasCopied: hasCopiedId, onCopy: onCopyId } = useClipboard(account);
  
  const [nearBalance, setNearBalnce] = useState<Decimal>(ZERO_DECIMAL);
  const [octBalance, setOCTBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [isEditing, setIsEditing] = useBoolean(false);
  const [isSubmiting, setIsSubmiting] = useBoolean(false);
  const [validatorProfile, setValidatorProfile] = useState<ValidatorProfile>();
  const [anchor, setAnchor] = useState<any>();

  const { hasCopied: hasCopiedValidatorId, onCopy: onCopyValidatorId } = useClipboard(validatorProfile?.validatorId);
  const { hasCopied: hasCopiedEmail, onCopy: onCopyEmail } = useClipboard(validatorProfile?.email);
  
  useEffect(() => {
    if (!account || !appchainId) return;
    utils.web
      .fetchJson(
        octopusConfig.nodeUrl,
        JSON.stringify({
          "jsonrpc": "2.0",
          "id": "dontcare",
          "method": "query",
          "params": {
            "request_type": "view_account",
            "finality": "final",
            "account_id": account
          }
        })
      ).then(res => {
        setNearBalnce(
          DecimalUtils.fromString(res.result.amount, 24)
        );
      });

    globalStore
      .tokenContract
      .ft_balance_of({
        account_id: account
      })
      .then(balance => {
        setOCTBalance(
          DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS)
        );
      });

    const anchorContractId = `${appchainId}.${octopusConfig.registryContractId}`;

    const provider = globalStore.walletConnection._near.connection.provider;
  
    provider.query({
      request_type: 'view_code',
      account_id: anchorContractId,
      finality: 'optimistic',
    }).then(res => {
      const contract = new Contract(
        globalStore.walletConnection.account(),
        anchorContractId,
        {
          viewMethods: [
            'get_validator_profile'
          ],
          changeMethods: [
            'set_validator_profile'
          ]
        }
      );
      setAnchor(contract);
    }).catch(err => {
      setAnchor(null);
      console.log('No anchor');
    });

  }, [account, appchainId, globalStore]);

  useEffect(() => {
    if (!anchor) {
      return;
    }
    anchor
      .get_validator_profile({
        validator_id: account
      })
      .then(({ profile, validator_id_in_appchain }) => {
        setValidatorProfile({
          validatorId: validator_id_in_appchain,
          email: profile?.email,
          socialMediaHandle: profile?.socialMediaHandle
        });
      });
  }, [anchor, account]);

  const onEdit = () => {
    setIsEditing.on();
  }

  const onChangeProfile = (key, val) => {
    setValidatorProfile({ ...validatorProfile, [key]: val });
  }

  const onUpdateProfile = () => {
    setIsSubmiting.on();
    anchor
      .set_validator_profile({
        profile: {
          email: validatorProfile.email,
          socialMediaHandle: validatorProfile.socialMediaHandle
        }
      })
      .then(res => {
        setIsSubmiting.off();
      }).catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setIsSubmiting.off();
        console.log(err);
      });
  }

  return (
    <Container maxW="container.md">
      <Flex mt={5} alignItems="center" justifyContent="space-between">
        <HStack>
          <HStack>
            <Icon as={CgProfile} w={5} h={5} />
            <Text>Account Profile in </Text>
          </HStack>
          <Heading fontSize="md">{appchainId}</Heading>
        </HStack>
        {
          globalStore.accountId === account ?
          isEditing ?
          <HStack>
            <Button variant="outline" onClick={setIsEditing.off} isDisabled={isSubmiting}>
              Cancel
            </Button>
            <Button variant="outline" colorScheme="octoColor" onClick={onUpdateProfile}
              isDisabled={isSubmiting} isLoading={isSubmiting}>
              Update
            </Button>
          </HStack> :
          <Button variant="outline" onClick={onEdit}>
            <EditIcon mr={2} /> Edit
          </Button> : null
        }
      </Flex>
      <Box mt={5} boxShadow="md" borderRadius="xl" p={4}>
        <Flex alignItems="center" justifyContent="space-between">
          <Heading fontSize="md">Account ID</Heading>
          <HStack>
            <Text>{account}</Text>
            <IconButton aria-label="copy" onClick={onCopyId} size="sm">
              { hasCopiedId ? <CheckIcon /> : <CopyIcon /> }
            </IconButton>
          </HStack>
        </Flex>
        <Divider mt={3} mb={3} />
        <Flex alignItems="flex-start" justifyContent="space-between">
          <Heading fontSize="md">Wallet Balance</Heading>
          <VStack>
            <Heading fontSize="sm">
              {DecimalUtils.beautify(nearBalance)} NEAR
            </Heading>
            <Heading fontSize="sm">
              {DecimalUtils.beautify(octBalance)} OCT
            </Heading>
          </VStack>
        </Flex>
        <Divider mt={3} mb={3} />
        <Flex alignItems="center" justifyContent="space-between">
          <Heading fontSize="md">Validator Account (in Appchain)</Heading>
          {
            validatorProfile === undefined ?
            <Spinner size="xs" /> :
            <HStack>
              <Text maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {encodeAddress(validatorProfile.validatorId)}
              </Text>
              <IconButton aria-label="copy" onClick={onCopyValidatorId} size="sm">
                { hasCopiedValidatorId ? <CheckIcon /> : <CopyIcon /> }
              </IconButton>
            </HStack>
          }
        </Flex>
        <Divider mt={3} mb={3} />
        <Flex alignItems="center" justifyContent="space-between">
          <Heading fontSize="md">Email</Heading>
          {
            validatorProfile === undefined ?
            <Spinner size="xs" /> :
            isEditing ?
            <Input placeholder="input email" defaultValue={validatorProfile?.email}
              onChange={e => onChangeProfile('email', e.target.value)} width="auto" /> :
            validatorProfile?.email ?
            <HStack>
              <Text maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {validatorProfile.email}
              </Text>
              <IconButton aria-label="copy" onClick={onCopyEmail} size="sm">
                { hasCopiedEmail ? <CheckIcon /> : <CopyIcon /> }
              </IconButton>
            </HStack> : null
          }
        </Flex>
        <Divider mt={3} mb={3} />
        <Flex alignItems="center" justifyContent="space-between">
          <Heading fontSize="md">Twitter</Heading>
          {
            validatorProfile === undefined ?
            <Spinner size="xs" /> :
            isEditing ?
            <Input placeholder="twitter/facebook, etc." defaultValue={validatorProfile?.socialMediaHandle}
              onChange={e => onChangeProfile('socialMediaHandle', e.target.value)} width="auto" /> :

            validatorProfile?.socialMediaHandle ?
            <Link isExternal href={`https://twitter.com/${validatorProfile?.socialMediaHandle}`}>
              <HStack>
                <Text maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {validatorProfile?.socialMediaHandle}
                </Text>
                <ExternalLinkIcon />
              </HStack>
            </Link> : null
          }
        </Flex>
      </Box>
    </Container>
  );
}