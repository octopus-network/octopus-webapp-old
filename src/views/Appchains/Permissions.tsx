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
  RadioGroup,
  Radio,
  useBoolean,
  InputRightElement,
  Flex,
  InputGroup
} from '@chakra-ui/react';

import { TriangleUpIcon } from '@chakra-ui/icons';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { AiOutlineEdit } from 'react-icons/ai';
import { loginNear } from 'utils';
import { toDecimals, fromDecimals } from 'utils';
import octopusConfig from 'config/octopus';
import { FAILED_TO_REDIRECT_MESSAGE, SIMPLE_CALL_GAS, COMPLEX_CALL_GAS } from 'config/constants';
import { useNavigate } from 'react-router-dom';

const Permissions = ({ status }) => {
  const toast = useToast();

  const isAdmin = window.accountId && (
    new RegExp(`\.${window.accountId}`).test(octopusConfig.registryContractId) ||
    window.accountId === octopusConfig.registryContractId
  );

  const isOwner = window.accountId && status?.appchain_owner === window.accountId;

  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState('');
  const [refundPercent, setRefundPercent] = useState(100);
  const [refundPopoverOpen, setRefundPopoverOpen] = useBoolean(false);
  const [passAuditingPopoverOpen, setPassAuditingPopoverOpen] = useBoolean(false);
  const [upvotePopoverOpen, setUpvotePopoverOpen] = useBoolean(false);
  const [downvotePopoverOpen, setDownvotePopoverOpen] = useBoolean(false);
  const [isEditing, setIsEditing] = useBoolean(false);

  const [voteAction, setVoteAction] = useState('');
  const [upvoteAmount, setUpvoteAmount] = useState('');
  const [downvoteAmount, setDownvoteAmount] = useState('');

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
        SIMPLE_CALL_GAS
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
        SIMPLE_CALL_GAS
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
        SIMPLE_CALL_GAS
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

    window
      .registryContract
      .pass_auditing_appchain(
        {
          appchain_id: status.appchain_id,
          // appchain_anchor_code: Array.from(u8a)
        },
        SIMPLE_CALL_GAS
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

  useEffect(() => {
    if (upvotePopoverOpen) {
      setVoteAction('deposit');
      if (upvoteInputRef.current) {
        setTimeout(() => {
          (upvoteInputRef.current as any).focus();
        }, 200);
      }
    } else if (downvotePopoverOpen) {
      setVoteAction('deposit');
      if (downvoteInputRef.current) {
        setTimeout(() => {
          (downvoteInputRef.current as any).focus();
        }, 200);
      }
    }
  }, [upvotePopoverOpen, downvotePopoverOpen]);

  if (!window.accountId) {
    return (
      status?.appchain_state === 'InQueue' ?
      (
        <Button colorScheme="octoColor" onClick={loginNear}>Login to Vote</Button>
      ) : null
    );
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
        SIMPLE_CALL_GAS,
        1,
      ).catch(err => {
        if (err.message === FAILED_TO_REDIRECT_MESSAGE) {
          return;
        }
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
        setLoadingType('');
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
        COMPLEX_CALL_GAS
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
                  Refund {refundPercent}% of {fromDecimals(status.register_deposit)}OCT
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
        <Button colorScheme="octoColor" isLoading={loadingType === 'passAuditing'}
          isDisabled={!!loadingType || passAuditingPopoverOpen} onClick={onPassAuditing}>Pass Auditing</Button>
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
                Refund {refundPercent}% of {fromDecimals(status.register_deposit)}OCT
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
              <Button mr="-px" variant="outline" colorScheme="octoColor"
                disabled={upvotePopoverOpen}
                onClick={setUpvotePopoverOpen.on}>
                <TriangleUpIcon />
                <Text fontSize="sm" ml="1">Upvote</Text>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton disabled={!!loadingType} />
              <PopoverBody mt="3">
                <Box p="2">
                  <RadioGroup onChange={(action: any) => setVoteAction(action)} value={voteAction}>
                    <HStack spacing={4}>
                      <Radio value="deposit">
                        Deposit
                      </Radio>
                      <Radio value="witdraw">
                        Withdraw
                      </Radio>
                    </HStack>
                  </RadioGroup>
                  <Box mt="3">
                    <InputGroup>
                      <Input ref={upvoteInputRef} placeholder={`${voteAction} amount`} value={upvoteAmount}
                        onChange={e => setUpvoteAmount(e.target.value)} />
                      <InputRightElement width="auto" children={
                        <Text mr="2" cursor="pointer" fontSize="sm" color="octoColor.500" onClick={() => setUpvoteAmount((
                          voteAction === 'deposit' ? accountBalance : upvoteDeposit
                        ) as any)}>
                          Max: {voteAction === 'deposit' ? accountBalance : upvoteDeposit}
                        </Text>
                      } />
                    </InputGroup>
                  </Box>
                  <Box mt="4">
                    <Button colorScheme="octoColor" isFullWidth={true}
                      isDisabled={!!loadingType || isNaN(upvoteAmount as any) || upvoteAmount as any <= 0} isLoading={loadingType === 'upvote'}
                      onClick={voteAction === 'deposit' ? onDepositVotes : onWithdrawVotes }>
                      { voteAction === 'deposit' ? 'Deposit' : 'Withdraw' } Upvotes
                    </Button>
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
              <Button mr="-px" variant="outline" colorScheme="octoColor"
                disabled={downvotePopoverOpen}
                onClick={setDownvotePopoverOpen.on}>
                <TriangleUpIcon />
                <Text fontSize="sm" ml="1">Downvote</Text>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton disabled={!!loadingType} />
              <PopoverBody mt="3">
                <Box p="2">
                  <RadioGroup onChange={(action: any) => setVoteAction(action)} value={voteAction}>
                    <HStack spacing={4}>
                      <Radio value="deposit">
                        Deposit
                      </Radio>
                      <Radio value="witdraw">
                        Withdraw
                      </Radio>
                    </HStack>
                  </RadioGroup>
                  <Box mt="3">
                    <InputGroup>
                      <Input ref={downvoteInputRef} placeholder={`${voteAction} amount`} value={downvoteAmount}
                        onChange={e => setDownvoteAmount(e.target.value)} />
                      <InputRightElement width="auto" children={
                        <Text mr="2" cursor="pointer" fontSize="sm" color="octoColor.500" onClick={() => setDownvoteAmount((
                          voteAction === 'deposit' ? accountBalance : downvoteDeposit
                        ) as any)}>
                          Max: {voteAction === 'deposit' ? accountBalance : downvoteDeposit}
                        </Text>
                      } />
                    </InputGroup>
                  </Box>
                  <Box mt="4">
                    <Button colorScheme="octoColor" isFullWidth={true}
                      isDisabled={!!loadingType || isNaN(downvoteAmount as any) || downvoteAmount as any <= 0} isLoading={loadingType === 'downvote'}
                      onClick={voteAction === 'deposit' ? onDepositVotes : onWithdrawVotes }>
                      { voteAction === 'deposit' ? 'Deposit' : 'Withdraw' } Downvotes
                    </Button>
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