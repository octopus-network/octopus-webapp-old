import React, { useEffect, useState } from 'react';

import {
  HStack,
  Button,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  PopoverFooter,
  PopoverCloseButton,
  VStack,
  Heading,
  Text,
  Input,
  Icon,
  Box,
  ButtonGroup,
  IconButton,
  useBoolean,
  Flex
} from '@chakra-ui/react';

import { MinusIcon } from '@chakra-ui/icons';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { BiLike, BiDislike } from 'react-icons/bi';
import { AiOutlineEdit } from 'react-icons/ai';

import { toDecimals, fromDecimals, BOATLOAD_OF_GAS } from 'utils';
import octopusConfig from 'config/octopus';
import { useNavigate } from 'react-router-dom';

const Permissions = ({ status }) => {
  const toast = useToast();

  const isAdmin = new RegExp(`\.${window.accountId}`).test(octopusConfig.registryContractId) ||
    window.accountId === octopusConfig.registryContractId;

  const isOwner = status?.appchain_owner === window.accountId;

  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState('');
  const [refundPercent, setRefundPercent] = useState(60);
  const [refundPopoverOpen, setRefundPopoverOpen] = useBoolean(false);
  const [passAuditingPopoverOpen, setPassAuditingPopoverOpen] = useBoolean(false);
  const [upvotePopoverOpen, setUpvotePopoverOpen] = useBoolean(false);
  const [downvotePopoverOpen, setDownvotePopoverOpen] = useBoolean(false);
  const [isEditing, setIsEditing] = useBoolean(false);

  const [voteAction, setVoteAction] = useState<'deposit'|'withdraw'>('deposit');
  const [upvoteAmount, setUpvoteAmount] = useState('0');
  const [downvoteAmount, setDownvoteAmount] = useState('0');
  const [anchorCodeFile, setAnchorCodeFile] = useState<File>();

  const [accountBalance, setAccountBalance] = useState(0);
  const [upvoteDeposit, setUpvoteDeposit] = useState(0);
  const [downvoteDeposit, setDownvoteDeposit] = useState(0);

  const initialFocusRef = React.useRef();
  const upvoteInputRef = React.useRef();
  const downvoteInputRef = React.useRef();

  useEffect(() => {
    if (!status) return;
    Promise.all([
      window.tokenContract.ft_balance_of({ account_id: window.accountId }),
      window.registryContract.get_upvote_deposit_for({
        appchain_id: status.appchain_id,
        account_id: window.accountId
      }),
      window.registryContract.get_downvote_deposit_for({
        appchain_id: status.appchain_id,
        account_id: window.accountId
      })
    ]).then(([balance, upvoteDeposit, downvoteDeposit]) => {
      setAccountBalance(fromDecimals(balance));
      setUpvoteDeposit(fromDecimals(upvoteDeposit));
      setDownvoteDeposit(fromDecimals(downvoteDeposit));
    });
  }, [status]);

  const onStartAudit = () => {
    setLoadingType('audit');
   
    window
      .registryContract
      .start_auditing_appchain(
        {
          appchain_id: status.appchain_id
        },
        BOATLOAD_OF_GAS
      ).then(() => {
        window.location.reload();
      }).catch(err => {
        setLoadingType('');
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  const onReject = () => {
    setLoadingType('reject');
    setRefundPopoverOpen.off();
    window
      .registryContract
      .reject_appchain(
        {
          appchain_id: status.appchain_id,
          refund_percent: refundPercent.toString()
        },
        BOATLOAD_OF_GAS
      ).then(() => {
        window.location.reload();
      }).catch(err => {
        setLoadingType('');
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  const onRemove = () => {
    setLoadingType('remove');
    setRefundPopoverOpen.off();
    window
      .registryContract
      .remove_appchain(
        {
          appchain_id: status.appchain_id
        },
        BOATLOAD_OF_GAS
      ).then(() => {
        navigate('/appchains/registered');
        window.location.reload();
      }).catch(err => {
        setLoadingType('');
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  const onPassAuditing = () => {
    setLoadingType('passAuditing');
    setPassAuditingPopoverOpen.off();

    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (e.target.readyState === FileReader.DONE) {
        const u8a = new Uint8Array(e.target.result as any);
      
        window
          .registryContract
          .pass_auditing_appchain(
            {
              appchain_id: status.appchain_id,
              appchain_anchor_code: Array.from(u8a)
            },
            BOATLOAD_OF_GAS
          ).then(() => {
            navigate('/appchains/inqueue');
            window.location.reload();
          }).catch(err => {
            setLoadingType('');
            toast({
              position: 'top-right',
              title: 'Error',
              description: err.toString(),
              status: 'error'
            });
          });
      }
    }
    reader.readAsArrayBuffer(anchorCodeFile);
    
  }

  const onChooseAnchorCode = (e) => {
    const input = e.target;
    const files = input.files;
    if (files.length) {
      setAnchorCodeFile(files[0]);
    } else {
      setAnchorCodeFile(null);
    }
  }

  if (!window.accountId) {
    return null;
  }

  const onUpvoteAction = (a: 'deposit' | 'withdraw') => {
    setUpvotePopoverOpen.toggle();
    setVoteAction(a);
    setTimeout(() => {
      if (upvoteInputRef.current) {
        (upvoteInputRef.current as any).focus();
      }
    }, 200);
  }

  const onDownvoteAction = (a: 'deposit' | 'withdraw') => {
    setDownvotePopoverOpen.toggle();
    setVoteAction(a);
    setTimeout(() => {
      if (downvoteInputRef.current) {
        (downvoteInputRef.current as any).focus();
      }
    }, 200);
  }

  const onDepositVotes = () => {
    const voteType = upvotePopoverOpen ? 'upvote' : 'downvote';
    const voteAmount = voteType === 'upvote' ? upvoteAmount : downvoteAmount;
    setLoadingType(voteType);
    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: octopusConfig.registryContractId,
          amount: toDecimals(voteAmount),
          msg: `${voteType}_appchain,${status.appchain_id}`
        },
        BOATLOAD_OF_GAS,
        1,
      ).catch(err => {
        console.log(err);
      });
  }

  const onWithdrawVotes = () => {
    const voteType = upvotePopoverOpen ? 'upvote' : 'downvote';
    const voteAmount = voteType === 'upvote' ? upvoteAmount : downvoteAmount;
    const method = voteType === 'upvote' ? 
      window.registryContract.withdraw_upvote_deposit_of : 
      window.registryContract.withdraw_downvote_deposit_of;

    setLoadingType(voteType);
    method(
        {
          appchain_id: status.appchain_id,
          amount: toDecimals(voteAmount)
        },
        BOATLOAD_OF_GAS
      ).then(() => {
        window.location.reload();
      }).catch(err => {
        setLoadingType('');
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  const onUpdate = () => {
    setLoadingType('update');

    setTimeout(() => {
      setLoadingType('');
      setIsEditing.off();
    }, 500);
  }

  return (
    <HStack spacing="2">
    {
      status?.appchain_state === 'Registered' ?
      (
        isAdmin ?
        <>
          <Button colorScheme="octoColor" isLoading={loadingType === 'audit'}
            isDisabled={!!loadingType} onClick={onStartAudit}>Start Audit</Button>
          <Popover
            initialFocusRef={initialFocusRef}
            placement="bottom"
            isOpen={refundPopoverOpen}
            onClose={setRefundPopoverOpen.off}
          >
            <PopoverTrigger>
              <Button colorScheme="red" isLoading={loadingType === 'reject'}
                isDisabled={!!loadingType || refundPopoverOpen} onClick={setRefundPopoverOpen.toggle}>Reject</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton />
              <PopoverBody>
                <VStack alignItems="flex-start">
                  <Heading fontSize="md">Refund percent</Heading>
                  <Box p="2" w="100%">
                    <Slider defaultValue={refundPercent} min={0} max={100} step={10} onChange={value => setRefundPercent(value)}>
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                </VStack>
              </PopoverBody>
              <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
                <Text color="gray" fontSize="sm">
                  Refund {refundPercent}% of {fromDecimals(status.register_deposit, 18)}OCT
                </Text>
                <Button colorScheme="red" size="sm" onClick={onReject}>Confirm</Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </> : 
        isOwner ?
        <Button colorScheme={isEditing ? 'octoColor' : 'gray'} isLoading={loadingType === 'update'}
          isDisabled={!!loadingType} onClick={isEditing ? onUpdate : setIsEditing.toggle}>
          { !isEditing && <Icon as={AiOutlineEdit} mr="1" /> }
          { isEditing ? 'Update' : 'Edit' }
        </Button> : null
      ) : 
      status?.appchain_state === 'Auditing' ?
      (
        isAdmin ?
        <>
       
        <Popover
          initialFocusRef={initialFocusRef}
          placement="bottom"
          isOpen={passAuditingPopoverOpen}
          onClose={setPassAuditingPopoverOpen.off}
        >
          <PopoverTrigger>
            <Button colorScheme="octoColor" isLoading={loadingType === 'passAuditing'}
              isDisabled={!!loadingType || passAuditingPopoverOpen} onClick={setPassAuditingPopoverOpen.toggle}>Pass Auditing</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverCloseButton />
            <PopoverBody>
              <VStack alignItems="flex-start">
                <Heading fontSize="md">Anchor code</Heading>
                <Box p="2" w="100%">
                  <Input type="file" placeholder="Choose file" onChange={onChooseAnchorCode} />
                </Box>
              </VStack>
            </PopoverBody>
            <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
              {
                anchorCodeFile ?
                anchorCodeFile.size > 1024 * 1024 ?
                <Text color="red" fontSize="sm">
                  File size limit!
                </Text> :
                <Text color="gray" fontSize="sm">
                  Code file size: {(anchorCodeFile.size/1024).toFixed(2)} kb
                </Text> : <Text>&nbsp;</Text>
              }
              <Button colorScheme="octoColor" size="sm" onClick={onPassAuditing}
                disabled={!anchorCodeFile || anchorCodeFile?.size > 1024 * 1024}>Confirm</Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>

        <Popover
          initialFocusRef={initialFocusRef}
          placement="bottom"
          isOpen={refundPopoverOpen}
          onClose={setRefundPopoverOpen.off}
        >
          <PopoverTrigger>
            <Button colorScheme="red" isLoading={loadingType === 'reject'}
              isDisabled={!!loadingType || refundPopoverOpen} onClick={setRefundPopoverOpen.toggle}>Reject</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverCloseButton />
            <PopoverBody>
              <VStack alignItems="flex-start">
                <Heading fontSize="md">Refund percent</Heading>
                <Box p="2" w="100%">
                  <Slider defaultValue={refundPercent} min={0} max={100} step={10} onChange={value => setRefundPercent(value)}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </VStack>
            </PopoverBody>
            <PopoverFooter d="flex" justifyContent="space-between" alignItems="center">
              <Text color="gray" fontSize="sm">
                Refund {refundPercent}% of {fromDecimals(status.register_deposit, 18)}OCT
              </Text>
              <Button colorScheme="red" size="sm" onClick={onReject}>Confirm</Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
        </> : null
      ) : 
      status?.appchain_state === 'Dead' ?
      (
        isAdmin ?
        <Button isLoading={loadingType === 'remove'}
          isDisabled={!!loadingType} onClick={onRemove}>
            Remove <Icon as={RiDeleteBin6Line} ml="1" />
          </Button> : null
      ) : 
      status?.appchain_state === 'InQueue' ?
      (
        <>
          <Popover
            initialFocusRef={initialFocusRef}
            placement="bottom"
            isOpen={upvotePopoverOpen}
            closeOnBlur={!loadingType}
            onClose={setUpvotePopoverOpen.off}
          >
            <PopoverTrigger>
              <ButtonGroup isAttached variant="outline">
                <Button mr="-px" 
                  disabled={upvotePopoverOpen}
                  onClick={() => onUpvoteAction('deposit')}>
                  <Icon as={BiLike} />
                  <Text fontSize="xs" ml="1">{fromDecimals(status.upvote_deposit)}</Text>
                </Button>
                <IconButton aria-label="withdraw downvote" icon={<MinusIcon />} 
                  disabled={upvotePopoverOpen}
                  onClick={() => onUpvoteAction('withdraw')} />
              </ButtonGroup>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton disabled={!!loadingType} />
              <PopoverBody>
                <Box p="2">
                  <Heading fontSize="md">{ voteAction === 'deposit' ? 'Deposit' : 'Withdraw' } upvotes</Heading>
                  <Flex justifyContent="flex-end" mt="3">
                    <Input placeholder={`${voteAction} amount`} borderRightRadius="0" ref={upvoteInputRef}
                      onChange={e => setUpvoteAmount(e.target.value)} />
                    <Button colorScheme="octoColor" borderLeftRadius="0" 
                      isDisabled={!!loadingType || isNaN(upvoteAmount as any) || upvoteAmount as any <= 0} isLoading={loadingType === 'upvote'}
                      onClick={voteAction === 'deposit' ? onDepositVotes : onWithdrawVotes }>
                      { voteAction === 'deposit' ? 'Deposit' : 'Withdraw' }
                    </Button>
                  </Flex>
                  <Box textAlign="right">
                    {
                      voteAction === 'deposit' ?
                      <Text mt="1" fontSize="sm" color="gray">Balance: {accountBalance} OCT</Text> :
                      <Text mt="1" fontSize="sm" color="gray">Max withdraw amount: {upvoteDeposit}</Text>
                    }
                  </Box>
                </Box>
              </PopoverBody>
            </PopoverContent>  
          </Popover>

          <Popover
            initialFocusRef={initialFocusRef}
            placement="bottom"
            isOpen={downvotePopoverOpen}
            closeOnBlur={!loadingType}
            onClose={setDownvotePopoverOpen.off}
          >
            <PopoverTrigger>
              <ButtonGroup isAttached variant="outline">
                <Button mr="-px" 
                  disabled={downvotePopoverOpen}
                  onClick={() => onDownvoteAction('deposit')}>
                  <Icon as={BiDislike} />
                  <Text fontSize="xs" ml="1">{fromDecimals(status.downvote_deposit)}</Text>
                </Button>
                <IconButton aria-label="withdraw upvote" icon={<MinusIcon />} 
                  disabled={downvotePopoverOpen}
                  onClick={() => onDownvoteAction('withdraw')} />
              </ButtonGroup>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton disabled={!!loadingType} />
              <PopoverBody>
                <Box p="2">
                  <Heading fontSize="md">{ voteAction === 'deposit' ? 'Deposit' : 'Withdraw' } downvotes</Heading>
                  <Flex justifyContent="flex-end" mt="3">
                    <Input placeholder={`${voteAction} amount`} borderRightRadius="0" ref={downvoteInputRef}
                      onChange={e => setDownvoteAmount(e.target.value)} />
                    <Button colorScheme="octoColor" borderLeftRadius="0" 
                      isDisabled={!!loadingType || isNaN(downvoteAmount as any) || downvoteAmount as any <= 0} isLoading={loadingType === 'downvote'}
                      onClick={voteAction === 'deposit' ? onDepositVotes : onWithdrawVotes }>
                      { voteAction === 'deposit' ? 'Deposit' : 'Withdraw' }
                    </Button>
                  </Flex>
                  <Box textAlign="right">
                    {
                      voteAction === 'deposit' ?
                      <Text mt="1" fontSize="sm" color="gray">Balance: {accountBalance} OCT</Text> :
                      <Text mt="1" fontSize="sm" color="gray">Max withdraw amount: {downvoteDeposit}</Text>
                    }
                  </Box>
                </Box>
              </PopoverBody>
            </PopoverContent>  
          </Popover>
          
        </>
      ) : null
    }
    </HStack>
  );
}

export default Permissions;