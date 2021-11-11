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

import { TriangleUpIcon, TriangleDownIcon, ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { DecimalUtils, loginNear, ZERO_DECIMAL } from 'utils';
import octopusConfig from 'config/octopus';
import { FAILED_TO_REDIRECT_MESSAGE, SIMPLE_CALL_GAS, COMPLEX_CALL_GAS, OCT_TOKEN_DECIMALS } from 'config/constants';
import { useNavigate } from 'react-router-dom';
import { ConfirmBootingModal, GoLiveModal } from 'components';
import { useTranslation } from 'react-i18next';
import Decimal from 'decimal.js';

const Permissions = ({ status, onGoStake, onCancelStake, inStaking, anchor }) => {
  const toast = useToast();
  const { t } = useTranslation();

  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState('');
  const [rejectPopoverOpen, setRejectPopoverOpen] = useBoolean(false);
  const [bootingModalOpen, setBootingModalOpen] = useBoolean(false);
  const [goLiveModalOpen, setGoLiveModalOpen] = useBoolean(false);
  const [passAuditingPopoverOpen, setPassAuditingPopoverOpen] = useBoolean(false);
  const [upvotePopoverOpen, setUpvotePopoverOpen] = useBoolean(false);
  const [downvotePopoverOpen, setDownvotePopoverOpen] = useBoolean(false);
  const [withdrawVotesPopoverOpen, setWithdrawVotesPopoverOpen] = useBoolean(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [upvoteAmount, setUpvoteAmount] = useState<Decimal>(ZERO_DECIMAL);
  const [downvoteAmount, setDownvoteAmount] = useState<Decimal>(ZERO_DECIMAL);

  const [accountBalance, setAccountBalance] = useState<Decimal>(ZERO_DECIMAL);
  const [upvoteDeposit, setUpvoteDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [downvoteDeposit, setDownvoteDeposit] = useState<Decimal>(ZERO_DECIMAL);
  const [withdrawingUpvotes, setWithdrawingUpvotes] = useState(false);
  const [withdrawingDownvotes, setWithdrawingDownvotes] = useState(false);

  const initialFocusRef = React.useRef();
  const upvoteInputRef = React.useRef();
  const downvoteInputRef = React.useRef();

  useEffect(() => {
    if (!status) return;
    Promise.all([
      window.accountId ?
      window.tokenContract.ft_balance_of({ account_id: window.accountId }) : Promise.resolve(0),
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
      setAccountBalance(
        DecimalUtils.fromString(balance, OCT_TOKEN_DECIMALS)
      );
      setUpvoteDeposit(
        DecimalUtils.fromString(upvoteDeposit, OCT_TOKEN_DECIMALS)
      );
      setDownvoteDeposit(
        DecimalUtils.fromString(downvoteDeposit, OCT_TOKEN_DECIMALS)
      );
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
      if (upvoteInputRef.current) {
        setTimeout(() => {
          (upvoteInputRef.current as any).focus();
        }, 200);
      }
    } else if (downvotePopoverOpen) {
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

    if (voteAmount.gt(accountBalance)) {
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
          amount: DecimalUtils.toU64(voteAmount, OCT_TOKEN_DECIMALS).toString(),
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

  const withdrawVotes = (type: string, amount: Decimal) => {
    const method = type === 'upvote' ? window.registryContract.withdraw_upvote_deposit_of :
      window.registryContract.withdraw_downvote_deposit_of;

    return method(
      {
        appchain_id: status.appchain_id,
        amount: DecimalUtils.toU64(amount, OCT_TOKEN_DECIMALS).toString()
      },
      COMPLEX_CALL_GAS
    ).then(() => {
      window.location.reload();
    }).catch(err => {
      toast({
        position: 'top-right',
        title: 'Error',
        description: err.toString(),
        status: 'error'
      });
    });
  }

  const onWithdrawVotes = async () => {
    const voteType = upvotePopoverOpen ? 'upvote' : 'downvote';
    const voteAmount = voteType === 'upvote' ? upvoteAmount : downvoteAmount;
    setIsWithdrawing(true);
    await withdrawVotes(voteType, voteAmount);
    setIsWithdrawing(false);
  }

  const onWithdrawUpvotes = async () => {
    setWithdrawingUpvotes(true);
    await withdrawVotes('upvote', upvoteDeposit);
    setWithdrawingUpvotes(false);
  }

  const onWithdrawDownvotes = async () => {
    setWithdrawingDownvotes(true);
    await withdrawVotes('downvote', downvoteDeposit);
    setWithdrawingDownvotes(false);
  }

  const onUpvoteAmountChange = ({ target: { value } }) => {
    setUpvoteAmount(DecimalUtils.fromString(value));
  }

  const onDownvoteAmountChange = ({ target: { value } }) => {
    setDownvoteAmount(DecimalUtils.fromString(value));
  }

  return (
    <>
      {
        inStaking ?
          <Button onClick={onCancelStake}>
            <ChevronLeftIcon mr={1} /> Back
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
                  status?.appchain_state === 'Staging' ?

                    (
                      isAdmin ?
                        <Button onClick={setBootingModalOpen.on} colorScheme="octoColor">
                          Go Booting
                        </Button> :
                        <HStack>
                          {
                            upvoteDeposit.gt(ZERO_DECIMAL) || downvoteDeposit.gt(ZERO_DECIMAL) ?
                              <Popover
                                initialFocusRef={initialFocusRef}
                                placement="bottom"
                                isOpen={withdrawVotesPopoverOpen}
                                onClose={setWithdrawVotesPopoverOpen.off}
                              >
                                <PopoverTrigger>
                                  <Button onClick={setWithdrawVotesPopoverOpen.on} colorScheme="octoColor" isDisabled={withdrawVotesPopoverOpen}>
                                    Withdraw Votes
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <PopoverBody>
                                    <Box p={2}>
                                      {
                                        upvoteDeposit.gt(ZERO_DECIMAL) ?
                                          <Flex>
                                            <Text>
                                              Your Upvotes: {DecimalUtils.beautify(upvoteDeposit)}
                                            </Text>
                                            <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                                              isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                                          </Flex> : null
                                      }
                                      {
                                        downvoteDeposit?.gt(ZERO_DECIMAL) ?
                                          <Flex mt={3}>
                                            <Text>
                                              Your Downvotes: {DecimalUtils.beautify(downvoteDeposit)}
                                            </Text>
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
                                onClick={onGoStake} variant="ghost">
                                Staking <ChevronRightIcon ml={1} />
                              </Button> :
                              anchor === undefined ?
                                <Spinner size="sm" /> : null
                          }
                        </HStack>
                    ) :

                    status?.appchain_state === 'Booting' ?
                      (
                        isAdmin ?
                          (
                            anchor ?
                            <Button onClick={setGoLiveModalOpen.on} colorScheme="octoColor">
                              Go Live
                            </Button> : null
                          ) :
                          <HStack>
                            {
                              upvoteDeposit.gt(ZERO_DECIMAL) || downvoteDeposit.gt(ZERO_DECIMAL) ?
                                <Popover
                                  initialFocusRef={initialFocusRef}
                                  placement="bottom"
                                  isOpen={withdrawVotesPopoverOpen}
                                  onClose={setWithdrawVotesPopoverOpen.off}
                                >
                                  <PopoverTrigger>
                                    <Button onClick={setWithdrawVotesPopoverOpen.on} colorScheme="octoColor" isDisabled={withdrawVotesPopoverOpen}>
                                      Withdraw Votes
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent>
                                    <PopoverBody>
                                      <Box p={2}>
                                        {
                                          upvoteDeposit.gt(ZERO_DECIMAL) ?
                                            <Flex>
                                              <Text>
                                                Your Upvotes: {DecimalUtils.beautify(upvoteDeposit)}
                                              </Text>
                                              <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                                                isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                                            </Flex> : null
                                        }
                                        {
                                          downvoteDeposit.gt(ZERO_DECIMAL) ?
                                            <Flex mt={3}>
                                              <Text>
                                                Your Downvotes: {DecimalUtils.beautify(downvoteDeposit)}
                                              </Text>
                                              <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingDownvotes}
                                                isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawDownvotes}>Withdraw</Button>
                                            </Flex> : null
                                        }

                                      </Box>
                                    </PopoverBody>
                                  </PopoverContent>
                                </Popover> : null
                            }
                          </HStack>
                      ) :

                      status?.appchan_state === 'Active' ?
                        (
                          isAdmin ?
                            null :
                            <HStack>
                              {
                                upvoteDeposit.gt(ZERO_DECIMAL) || downvoteDeposit.gt(ZERO_DECIMAL) ?
                                  <Popover
                                    initialFocusRef={initialFocusRef}
                                    placement="bottom"
                                    isOpen={withdrawVotesPopoverOpen}
                                    onClose={setWithdrawVotesPopoverOpen.off}
                                  >
                                    <PopoverTrigger>
                                      <Button onClick={setWithdrawVotesPopoverOpen.on} colorScheme="octoColor" isDisabled={withdrawVotesPopoverOpen}>
                                        Withdraw Votes
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                      <PopoverBody>
                                        <Box p={2}>
                                          {
                                            upvoteDeposit.gt(ZERO_DECIMAL) ?
                                              <Flex>
                                                <Text>
                                                  Your Upvotes: {DecimalUtils.beautify(upvoteDeposit)}
                                                </Text>
                                                <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingUpvotes}
                                                  isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawUpvotes}>Withdraw</Button>
                                              </Flex> : null
                                          }
                                          {
                                            downvoteDeposit.gt(ZERO_DECIMAL) ?
                                              <Flex mt={3}>
                                                <Text>
                                                  Your Downvotes: {DecimalUtils.beautify(downvoteDeposit)}
                                                </Text>
                                                <Button size="xs" colorScheme="octoColor" ml={2} variant="outline" isLoading={withdrawingDownvotes}
                                                  isDisabled={withdrawingUpvotes || withdrawingDownvotes} onClick={onWithdrawDownvotes}>Withdraw</Button>
                                              </Flex> : null
                                          }

                                        </Box>
                                      </PopoverBody>
                                    </PopoverContent>
                                  </Popover> : null
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
                                          <Input ref={upvoteInputRef} placeholder={`amount of votes`} value={upvoteAmount.toNumber() || ''}
                                            onChange={onUpvoteAmountChange} type="number" />
                                          <Flex justifyContent="flex-end" mt={2}>
                                            <Text fontSize="sm" color="gray">
                                              Voted: {
                                                DecimalUtils.beautify(upvoteDeposit)
                                              } OCT
                                            </Text>
                                          </Flex>
                                        </Box>
                                        <Box mt={4}>
                                          <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                                            <GridItem colSpan={upvoteDeposit.gte(ZERO_DECIMAL) ? 5 : 3}>
                                              <Button colorScheme="octoColor" isFullWidth={true}
                                                isDisabled={!!loadingType || isWithdrawing || upvoteAmount.lte(ZERO_DECIMAL)} isLoading={loadingType === 'upvote'}
                                                onClick={onDepositVotes}>Upvote</Button>
                                            </GridItem>
                                            {
                                              upvoteDeposit.lt(ZERO_DECIMAL) ?
                                                <GridItem colSpan={2}>
                                                  <Button isFullWidth={true}
                                                    isDisabled={isWithdrawing || upvoteAmount.lte(ZERO_DECIMAL)} isLoading={isWithdrawing}
                                                    onClick={onWithdrawVotes}>Recall</Button>
                                                </GridItem> : null
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
                                          <Input ref={downvoteInputRef} placeholder={`amount of votes`} value={downvoteAmount.toNumber() || ''}
                                            onChange={onDownvoteAmountChange} type="number" />
                                          <Flex justifyContent="flex-end" mt={2}>
                                            <Text fontSize="sm" color="gray">
                                              Voted: {
                                                DecimalUtils.beautify(downvoteDeposit)
                                              } OCT</Text>
                                          </Flex>
                                        </Box>
                                        <Box mt={4}>
                                          <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                                            <GridItem colSpan={downvoteDeposit.lte(ZERO_DECIMAL) ? 5 : 3}>
                                              <Button colorScheme="octoColor" isFullWidth={true}
                                                isDisabled={!!loadingType || isWithdrawing || downvoteAmount.lte(ZERO_DECIMAL)} isLoading={loadingType === 'downvote'}
                                                onClick={onDepositVotes}>Downvote</Button>
                                            </GridItem>
                                            {
                                              downvoteDeposit.gt(ZERO_DECIMAL) ?
                                                <GridItem colSpan={2}>
                                                  <Button isFullWidth={true}
                                                    isDisabled={isWithdrawing || downvoteAmount.lte(ZERO_DECIMAL)} isLoading={isWithdrawing}
                                                    onClick={onWithdrawVotes}>Recall</Button>
                                                </GridItem> : null
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
      }
      <ConfirmBootingModal isOpen={bootingModalOpen} onClose={setBootingModalOpen.off} 
        anchor={anchor} appchainId={status?.appchain_id} />
      <GoLiveModal isOpen={goLiveModalOpen} onClose={setGoLiveModalOpen.off} anchor={anchor} />
    </>
  );
}

export default Permissions;