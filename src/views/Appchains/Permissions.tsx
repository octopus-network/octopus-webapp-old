import React, { useEffect, useState } from 'react';

import {
  HStack,
  Button,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  PopoverCloseButton,
  VStack,
  Grid,
  GridItem,
  Heading,
  Text,
  Input,
  Icon,
  Box,
  Spinner,
  Flex,
  useBoolean
} from '@chakra-ui/react';

import { TriangleUpIcon, TriangleDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { loginNear } from 'utils';
import { toDecimals, fromDecimals } from 'utils';
import octopusConfig from 'config/octopus';
import { FAILED_TO_REDIRECT_MESSAGE, SIMPLE_CALL_GAS, COMPLEX_CALL_GAS } from 'config/constants';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const Permissions = ({ status, onGoStake, onCancelStake, inStaking, anchor }) => {
  const toast = useToast();
  const { t } = useTranslation();

  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState('');
  const [rejectPopoverOpen, setRejectPopoverOpen] = useBoolean(false);
  const [bootingPopoverOpen, setBootingPopoverOpen] = useBoolean(false);
  const [passAuditingPopoverOpen, setPassAuditingPopoverOpen] = useBoolean(false);
  const [upvotePopoverOpen, setUpvotePopoverOpen] = useBoolean(false);
  const [downvotePopoverOpen, setDownvotePopoverOpen] = useBoolean(false);
  const [withdrawVotesPopoverOpen, setWithdrawVotesPopoverOpen] = useBoolean(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [voteAction, setVoteAction] = useState('');
  const [upvoteAmount, setUpvoteAmount] = useState('');
  const [downvoteAmount, setDownvoteAmount] = useState('');

  const [accountBalance, setAccountBalance] = useState(0);
  const [upvoteDeposit, setUpvoteDeposit] = useState<any>();
  const [downvoteDeposit, setDownvoteDeposit] = useState<any>();
  const [withdrawingUpvotes, setWithdrawingUpvotes] = useState(false);
  const [withdrawingDownvotes, setWithdrawingDownvotes] = useState(false);

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
      }),
      window.registryContract.get_owner()
    ]).then(([balance, upvoteDeposit, downvoteDeposit, owner]) => {
      setAccountBalance(fromDecimals(balance));
      setUpvoteDeposit(fromDecimals(upvoteDeposit));
      setDownvoteDeposit(fromDecimals(downvoteDeposit));
      setIsAdmin(owner === window.accountId);
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
    setRejectPopoverOpen.off();
    window
      .registryContract
      .reject_appchain(
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

  const onBooting = () => {
    setLoadingType('booting');
    setBootingPopoverOpen.off();
    window
      .registryContract
      .go_booting(
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

  const onRemove = () => {
    setLoadingType('remove');
    setRejectPopoverOpen.off();
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
        <Button colorScheme="octoColor" variant="outline" onClick={loginNear}>Login to Vote</Button>
      ) : null
    );
  }

  const onDepositVotes = () => {
    
    const voteType = upvotePopoverOpen ? 'upvote' : 'downvote';
    const voteAmount = voteType === 'upvote' ? upvoteAmount : downvoteAmount;

    if ((voteAmount as any)*1 > accountBalance) {
      return toast({
        position: 'top-right',
        title: 'Error',
        description: 'Insufficient Balance',
        status: 'error'
      });
    }

    setLoadingType(voteType);
    window
      .tokenContract
      .ft_transfer_call(
        {
          receiver_id: octopusConfig.registryContractId,
          amount: toDecimals(voteAmount),
          msg: JSON.stringify({
            [`${voteType.replace(/^([a-z])|\s+([a-z])/g, $1 => $1.toUpperCase())}Appchain`]: {
              "appchain_id": status.appchain_id
            }
          })
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

  const withdrawVotes = (type, amount) => {
    const method = type === 'upvote' ? window.registryContract.withdraw_upvote_deposit_of :
      window.registryContract.withdraw_downvote_deposit_of;
   
    method(
      {
        appchain_id: status.appchain_id,
        amount: toDecimals(amount)
      },
      COMPLEX_CALL_GAS
    ).then(() => {
      window.location.reload();
    }).catch(err => {
      setIsWithdrawing(false);
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    });
  }
  
  const onWithdrawVotes = () => {
    const voteType = upvotePopoverOpen ? 'upvote' : 'downvote';
    const voteAmount = voteType === 'upvote' ? upvoteAmount : downvoteAmount;
    withdrawVotes(voteType, voteAmount);
  }

  const onWithdrawUpvotes = () => {
    setWithdrawingUpvotes(true);
    withdrawVotes('upvote', upvoteDeposit);
  }

  const onWithdrawDownvotes = () => {
    setWithdrawingDownvotes(true);
    withdrawVotes('downvote', downvoteDeposit);
  }

  return (
   
      inStaking ?
      <Button onClick={onCancelStake}>
        Cancel
      </Button> :
    
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
              isOpen={rejectPopoverOpen}
              onClose={setRejectPopoverOpen.off}
              >
              <PopoverTrigger>
                <Button colorScheme="red" isLoading={loadingType === 'reject'}
                  isDisabled={!!loadingType || rejectPopoverOpen} onClick={setRejectPopoverOpen.toggle}>Reject</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <Box p="2" d="flex">
                    <Heading fontSize="lg">Are you confirm to reject this registration?</Heading>
                  </Box>
                </PopoverBody>
                <PopoverFooter d="flex" justifyContent="flex-end">
                  <HStack spacing={3}>
                    <Button size="sm" onClick={setRejectPopoverOpen.off}>{t('Cancel')}</Button>
                    <Button size="sm" onClick={onReject} colorScheme="octoColor">{t('Confirm')}</Button>
                  </HStack>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
            
          </> : null
        
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
            isOpen={rejectPopoverOpen}
            onClose={setRejectPopoverOpen.off}
            >
            <PopoverTrigger>
              <Button colorScheme="red" isLoading={loadingType === 'reject'}
                isDisabled={!!loadingType || rejectPopoverOpen} onClick={setRejectPopoverOpen.toggle}>Reject</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverBody>
                <Box p="2" d="flex">
                  <Heading fontSize="lg">Are you confirm to reject this registration?</Heading>
                </Box>
              </PopoverBody>
              <PopoverFooter d="flex" justifyContent="flex-end">
                <HStack spacing={3}>
                  <Button size="sm" onClick={setRejectPopoverOpen.off}>{t('Cancel')}</Button>
                  <Button size="sm" onClick={onReject} colorScheme="octoColor">{t('Confirm')}</Button>
                </HStack>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
          </> : null
        ) : 
        status?.appchain_state === 'Staging' ||
        status?.appchain_state === 'Booting' ?
        (
          isAdmin ?
          <>
            <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={bootingPopoverOpen}
              onClose={setBootingPopoverOpen.off}
              >
              <PopoverTrigger>
                <Button colorScheme="octoColor" isLoading={loadingType === 'booting'}
                  isDisabled={!!loadingType || bootingPopoverOpen} onClick={setBootingPopoverOpen.toggle}>Go Booting</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <Flex p={2}>
                    <Heading fontSize="lg">Are you confirm to set this appchain status to 'Booting'?</Heading>
                  </Flex>
                </PopoverBody>
                <PopoverFooter d="flex" justifyContent="flex-end">
                  <HStack spacing={3}>
                    <Button size="sm" onClick={setBootingPopoverOpen.off}>{t('Cancel')}</Button>
                    <Button size="sm" onClick={onBooting} colorScheme="octoColor">{t('Confirm')}</Button>
                  </HStack>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
          </> :
          <HStack>
            {
              upvoteDeposit || downvoteDeposit ?
              <Popover
                initialFocusRef={initialFocusRef}
                placement="bottom"
                isOpen={withdrawVotesPopoverOpen}
                onClose={setWithdrawVotesPopoverOpen.off}
                >
                <PopoverTrigger>
                  <Button onClick={setWithdrawVotesPopoverOpen.on} colorScheme="octoColor">
                    Withdraw Votes
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverBody>
                    <Box p={2}>
                      {
                        upvoteDeposit > 0 ?
                        <Flex>
                          <Text>Your Upvotes: {upvoteDeposit}</Text>
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                        </Flex> : null
                      }
                      {
                        downvoteDeposit > 0 ?
                        <Flex mt={3}>
                          <Text>Your Downvotes: {downvoteDeposit}</Text>
                          <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingDownvotes}
                            isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawDownvotes}>Withdraw</Button>
                        </Flex> : null
                      }
                      
                    </Box>
                  </PopoverBody>
                </PopoverContent>
              </Popover> : null
            }
            {
              !!anchor ?
              <Button colorScheme="octoColor"
                onClick={onGoStake}>
                Staking <ChevronRightIcon ml={1} />
              </Button> : 
              anchor === undefined ?
              <Spinner size="sm" /> : null
            }
          </HStack>
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
                <PopoverCloseButton disabled={!!loadingType || isWithdrawing} />
                <PopoverBody mt={3}>
                  <Box p={2}>
                    <Box mt={3}>
                      <Input ref={upvoteInputRef} placeholder={`amount of votes`} value={upvoteAmount}
                        onChange={e => setUpvoteAmount(e.target.value)} />
                      <Flex justifyContent="flex-end" mt={2}>
                        <Text fontSize="sm" color="gray">Voted: {upvoteDeposit === undefined ? <Spinner size="xs" /> : upvoteDeposit } OCT</Text>
                      </Flex>
                    </Box>
                    <Box mt={4}>
                      <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                        <GridItem colSpan={upvoteDeposit <= 0 ? 5 : 3}>
                          <Button colorScheme="octoColor" isFullWidth={true}
                            isDisabled={!!loadingType || isWithdrawing || isNaN(upvoteAmount as any) || upvoteAmount as any <= 0} isLoading={loadingType === 'upvote'}
                            onClick={onDepositVotes}>Upvote</Button>
                        </GridItem>
                        {
                          upvoteDeposit > 0 &&
                          <GridItem colSpan={2}>
                            <Button isFullWidth={true}
                              isDisabled={isWithdrawing || isNaN(upvoteAmount as any) || upvoteAmount as any <= 0} isLoading={isWithdrawing}
                              onClick={onWithdrawVotes}>Recall</Button>
                          </GridItem>
                        }
                      </Grid>
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
                  <TriangleDownIcon />
                  <Text fontSize="sm" ml="1">Downvote</Text>
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverCloseButton disabled={!!loadingType || isWithdrawing} />
                <PopoverBody mt={3}>
                  <Box p={2}>
                    <Box mt={3}>
                      <Input ref={downvoteInputRef} placeholder={`amount of votes`} value={downvoteAmount}
                        onChange={e => setDownvoteAmount(e.target.value)} />
                      <Flex justifyContent="flex-end" mt={2}>
                        <Text fontSize="sm" color="gray">Voted: {downvoteDeposit === undefined ? <Spinner size="xs" /> : downvoteDeposit } OCT</Text>
                      </Flex>
                    </Box>
                    <Box mt={4}>
                      <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                        <GridItem colSpan={downvoteDeposit <= 0 ? 5 : 3}>
                          <Button colorScheme="octoColor" isFullWidth={true}
                            isDisabled={!!loadingType || isWithdrawing || isNaN(downvoteAmount as any) || downvoteAmount as any <= 0} isLoading={loadingType === 'downvote'}
                            onClick={onDepositVotes}>Downvote</Button>
                        </GridItem>
                        {
                          downvoteDeposit > 0 &&
                          <GridItem colSpan={2}>
                            <Button isFullWidth={true}
                              isDisabled={isWithdrawing || isNaN(downvoteAmount as any) || downvoteAmount as any <= 0} isLoading={isWithdrawing}
                              onClick={onWithdrawVotes}>Recall</Button>
                          </GridItem>
                        }
                      </Grid>
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