import React, { useEffect, useState } from 'react';

import { 
  Container,
  Box,
  Heading,
  Flex,
  Button,
  Icon,
  Tabs,
  TabList,
  Tab,
  Skeleton,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  GridItem,
  Tooltip,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  CloseButton,
  PopoverTrigger,
  PopoverContent,
  UnorderedList,
  List,
  ListItem,
  useToast,
  useBoolean,
  Popover,
  PopoverBody,
  PopoverFooter,
  Avatar
} from '@chakra-ui/react';

import { COMPLEX_CALL_GAS } from 'config/constants';
import { FiEdit, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { AiOutlineAudit, AiOutlineInbox } from 'react-icons/ai';
import { BiBadgeCheck } from 'react-icons/bi';
import { BsFillStopFill, BsPeople } from 'react-icons/bs';
import { GoTasklist } from 'react-icons/go';
import { VscServerProcess } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { QuestionOutlineIcon, QuestionIcon, InfoOutlineIcon, WarningIcon } from '@chakra-ui/icons';
import BootingItem from './BootingItem';
import InQueueItem from './InQueueItem';
import StagingItem from './StagingItem';
import RegisteredItem from './RegisteredItem';

import Overview from './Overview';
import { fromDecimals } from 'utils';

const NoAppchains = () => (
  <Box p={3} borderRadius={10} flex={1} bg="rgba(120, 120, 150, .04)">
    <Flex color="gray" flexDirection="column" justifyContent="center" alignItems="center">
      <InfoOutlineIcon w={5} h={5} color="gray.400" />
      <Text mt={2} fontSize="xs">No appchains</Text>
    </Flex>
  </Box>
);

const StatBox = ({
  title,
  value,
  icon,
  display
}: {
  title: string;
  tooltip?: string;
  value: string|number;
  icon: any;
  color?: string;
  display?: any;
}) => {
  return (
    <Box display={display}>
      <HStack>
        <Box w={10} h={10} borderRadius="50%"  display={{ base: 'none', md: 'flex' }}
          alignItems="center" justifyContent="center" mr={1}>
          <Icon as={icon} w={7} h={7} color="rgba(255, 255, 255, 1)" />
        </Box>
        <VStack alignItems="start" spacing={0}>
          <HStack>
            <Text color="rgba(255, 255, 255, .7)" fontSize="sm">{title}</Text>
          </HStack>
          <Skeleton isLoaded={value !== ''}>
            <Heading color="white" fontWeight={600} fontSize={{ base: 'lg', md: '2xl' }}>
              {value !== '' ? value : 'loading'}
            </Heading>
          </Skeleton>
        </VStack>
      </HStack>
    </Box>
  );
}

const Appchains = () => {
  
  const { id } = useParams();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
 
  const [numPreAudit, setNumPreAudit] = useState<string|number>('');
  const [numAuditing, setNumAuditing] = useState<string|number>('');
  const [numInQueue, setNumInQueue] = useState<string|number>('');
  const [numStaging, setNumStaging] = useState<string|number>('');
  const [numBooting, setNumBooting] = useState<string|number>('');
  const [isCounting, setIsCounting] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
 
  const [isCounter, setIsCounter] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [countPopoverOpen, setCountPopoverOpen] = useBoolean(false);
  const [concludePopoverOpen, setConcludePopoverOpen] = useBoolean(false);
  const [highestVotes, setHighestVotes] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [preAuditAppchains, setPreAuditAppchains] = useState<undefined|any[]>();
  const [auditingAppchains, setAuditingAppchains] = useState<undefined|any[]>();
  const [votingAppchains, setVotingAppchains] = useState<undefined|any[]>();
  const [stakingAppchains, setStakingAppchains] = useState<undefined|any[]>();
  const [bootingAppchains, setBootingAppchains] = useState<undefined|any[]>();

  const initialFocusRef = React.useRef();

  useEffect(() => {
    const promises = [
      'Registered', 'Auditing', 'Dead', 'InQueue', 'Staging', 'Booting'
    ].map(state => window.registryContract.get_appchains_count_of({
      appchain_state: state
    }));

    Promise.all(promises).then(([
      registeredCount, auditingCount, deadCount, inQueueCount, stagingCount, bootingCount
    ]) => {
      setNumPreAudit((registeredCount*1 + deadCount*1));
      setNumAuditing((auditingCount));
      setNumInQueue(inQueueCount);
      setNumStaging(stagingCount);
      setNumBooting(bootingCount);
    });

    Promise.all([
      window.registryContract.get_owner(),
      window.registryContract.get_registry_settings()
    ]).then(([owner, { operator_of_counting_voting_score }]) => {
      setIsOwner(owner === window.accountId);
      setIsCounter(operator_of_counting_voting_score === window.accountId);
    });

    loadingList();

  }, []);

  const loadingList = async () => {
    setIsLoadingList(true);
    return Promise.all([
      ['Registered', 'Dead'],
      ['Auditing'],
      ['InQueue'],
      ['Staging'],
      ['Booting'],
    ].map(states => window
      .registryContract
      .get_appchains_with_state_of({ 
        appchain_state: states,
        page_number: 1,
        page_size: 10,
        sorting_field: 'RegisteredTime',
        sorting_order: 'Descending'
    }))).then(([preAudit, auditing, voting, staking, booting]) => {
      setPreAuditAppchains(preAudit);
      setAuditingAppchains(auditing);
      setVotingAppchains(voting);
      setStakingAppchains(staking);
      setBootingAppchains(booting);
      setIsLoadingList(false);
      let highest = 0;
      for (let i = 0; i < voting.length; i++) {
        const { upvote_deposit, downvote_deposit } = voting[i];
        if (fromDecimals(upvote_deposit) > highest) {
          highest = fromDecimals(upvote_deposit);
        }
        if (fromDecimals(downvote_deposit) > highest) {
          highest = fromDecimals(upvote_deposit);
        }
        setHighestVotes(highest);
      }
      if (voting.length) {
        setHighestScore(fromDecimals(voting[0].voting_score));
      }
    });
  }

  const onDrawerClose = () => {
    navigate(`/appchains`);
  }

  const onCount = () => {
    setIsCounting(true);
    setCountPopoverOpen.off();
    window
      .registryContract
      .count_voting_score(
        {}, 
        COMPLEX_CALL_GAS
      ).then(() => {
        window.location.reload();
      }).catch(err => {
        setIsCounting(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  const onConclude = () => {
    setIsConcluding(true);
    setConcludePopoverOpen.off();
    window
      .registryContract
      .conclude_voting_score(
        {},
        COMPLEX_CALL_GAS
      ).then(() => {
        window.location.reload();
      }).catch(err => {
        setIsConcluding(false);
        toast({
          position: 'top-right',
          title: 'Error',
          description: err.toString(),
          status: 'error'
        });
      });
  }

  return (
    <>
    <Container mt="8" mb="8">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading fontSize="2xl" color="gray">{t('Overview')}</Heading>
        <RouterLink to="/appchains/join">
          <Button colorScheme="octoColor" variant="outline">
            <Icon as={FiPlus} mr="1" /> {t('Join')}
          </Button>
        </RouterLink>
      </Flex>
      <Flex mt={6}>
        <Box boxShadow="lg" p={6} borderRadius={10} flex={1}
          position="relative" overflow="hidden" bgGradient="linear(to-r, #51b1c8, #a5e7f2)">
          <SimpleGrid columns={5}>
            <StatBox title={t('Pre-Audit')} value={numPreAudit} icon={FiEdit} />
            <StatBox title={t('Auditing')} value={numAuditing} icon={AiOutlineAudit} />
            <StatBox title={t('Voting')} value={numInQueue} icon={FiCheckCircle} />
            <StatBox title={t('Staking')} value={numStaging} icon={AiOutlineInbox} />
            <StatBox title={t('booting')} value={numBooting} icon={VscServerProcess} />
          </SimpleGrid>
        </Box>
      </Flex>
      <Box mt={8}>
        <Flex justifyContent="space-between">
          <Heading fontSize="xl" color="gray">{t('Pre-Audit')}</Heading>
          <Tooltip label="The appchains have registered, or in auditing/dead state.">
            <QuestionOutlineIcon color="gray" cursor="pointer" />
          </Tooltip>
        </Flex>
        <Box mt={4}>
          <Skeleton isLoaded={!!preAuditAppchains}>
            {
              preAuditAppchains?.length ?
              <>
                <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl={4} pr={4} pb={2} fontSize="sm">
                  <GridItem colSpan={5}>{t('ID')}</GridItem>
                  <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>{t('Founder')}</GridItem>
                  <GridItem colSpan={4}>{t('State')}</GridItem>
                  <GridItem colSpan={1} />
                </SimpleGrid>
                <List spacing={3}>
                {
                  preAuditAppchains.map((appchain, idx) => (
                    <RegisteredItem appchain={appchain} key={`appchain-${idx}`} /> 
                  ))
                }
                </List>
              </> :
              <NoAppchains />
            }
          </Skeleton>
        </Box>
      </Box>
      <Box mt={8}>
        <Flex justifyContent="space-between">
          <Heading fontSize="xl" color="gray">{t('Auditing')}</Heading>
          <Tooltip label="Auditing appchains">
            <QuestionOutlineIcon color="gray" cursor="pointer" />
          </Tooltip>
        </Flex>
        <Box mt={4}>
          <Skeleton isLoaded={!!auditingAppchains}>
            {
              auditingAppchains?.length ?
              <>
                <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl={4} pr={4} pb={2} fontSize="sm">
                  <GridItem colSpan={5}>{t('ID')}</GridItem>
                  <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>{t('Founder')}</GridItem>
                  <GridItem colSpan={4}>{t('State')}</GridItem>
                  <GridItem colSpan={1} />
                </SimpleGrid>
                <List spacing={3}>
                {
                  auditingAppchains.map((appchain, idx) => (
                    <RegisteredItem appchain={appchain} key={`appchain-${idx}`} /> 
                  ))
                }
                </List>
              </> :
              <NoAppchains />
            }
          </Skeleton>
        </Box>
      </Box>
      <Box mt={8}>
        <Flex justifyContent="space-between">
          <Heading fontSize="xl" color="gray">{t('Voting')}</Heading>
          <HStack spacing={3}>
            {
              isCounter || isOwner ?
              (
                isCounter ?
                <Popover
                  initialFocusRef={initialFocusRef}
                  placement="bottom"
                  onClose={setCountPopoverOpen.off}
                  isOpen={countPopoverOpen}
                >
                  <PopoverTrigger>
                    <Button size="sm" disabled={isCounting || isConcluding || countPopoverOpen} onClick={setCountPopoverOpen.on}
                      display={{ base: 'none', md: 'block' }} isLoading={isCounting}>
                      <Icon as={BiBadgeCheck} mr="1" /> {t('Count score')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverBody>
                      <Box p="2" d="flex">
                        <Heading fontSize="lg">Are you confirm to count score?</Heading>
                      </Box>
                    </PopoverBody>
                    <PopoverFooter d="flex" justifyContent="flex-end">
                      <HStack spacing={3}>
                        <Button size="sm" onClick={setCountPopoverOpen.off}>{t('Cancel')}</Button>
                        <Button size="sm" onClick={onCount} colorScheme="octoColor">{t('Confirm')}</Button>
                      </HStack>
                    </PopoverFooter>
                  </PopoverContent>
                </Popover> : 
                <Popover
                  initialFocusRef={initialFocusRef}
                  placement="bottom"
                  onClose={setConcludePopoverOpen.off}
                  isOpen={concludePopoverOpen}
                >
                  <PopoverTrigger>
                    <Button size="sm" colorScheme="octoColor" display={{ base: 'none', md: 'block' }} 
                      disabled={isCounting || isConcluding || concludePopoverOpen} isLoading={isConcluding} 
                      onClick={setConcludePopoverOpen.on}>
                      <Icon as={BsFillStopFill} mr="1" /> {t('Conclude score')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverBody>
                      <Box p="2" d="flex">
                        <Heading fontSize="lg">Are you confirm to conclude score?</Heading>
                      </Box>
                    </PopoverBody>
                    <PopoverFooter d="flex" justifyContent="flex-end">
                      <HStack spacing={3}>
                        <Button size="sm" onClick={setConcludePopoverOpen.off}>{t('Cancel')}</Button>
                        <Button size="sm" onClick={onConclude} colorScheme="octoColor">{t('Confirm')}</Button>
                      </HStack>
                    </PopoverFooter>
                  </PopoverContent>
                </Popover>
              ) :
              <>
              <HStack>
                <Flex alignItems="center">
                  <Box w="10px" h="10px" bg="#8884d8" borderRadius={2} />
                  <Text fontSize="sm" ml={1} color="gray">Upvotes</Text>
                </Flex>
                <Flex alignItems="center">
                  <Box w="10px" h="10px" bg="#82ca9d" borderRadius={2} />
                  <Text fontSize="sm" ml={1} color="gray">Downvotes</Text>
                </Flex>
              </HStack>
              <Popover trigger="hover" placement="top">
                <PopoverTrigger>
                  <Flex alignItems="center" color="octoColor.500" fontSize="sm" cursor="pointer">
                    <QuestionOutlineIcon />
                    <Text ml="1">Voting rules</Text>
                  </Flex>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverBody>
                    <UnorderedList fontSize="sm">
                      <ListItem>$OCT holders can change the ranking of appchain by upvoting or downvoting. </ListItem>
                      <ListItem>At around 00:00 UTC each day, the Octopus team’s operator counts the votes of appchains, the score on that day is the number of upvotes minus the number of downvotes. </ListItem>
                      <ListItem>After a week of voting, the appchain with the highest total score moves on to the next stage.</ListItem>
                      <ListItem>The total score of all the  other appchains will decrease by 50% when an appchain moves to the next stage. </ListItem>
                      <ListItem>The $OCT holders may withdraw his vote at any time.</ListItem>
                    </UnorderedList>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              </>
            }
          </HStack>
        </Flex>
        <Box mt={4}>
          <Skeleton isLoaded={!!auditingAppchains}>
            {
              votingAppchains?.length ?
              <>
                <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl={4} pr={4} pb={2} fontSize="sm">
                  <GridItem colSpan={4}>{t('ID')}</GridItem>
                  <GridItem colSpan={5} textAlign="center"
                    display={{ base: 'none', md: 'block' }}>{t('Votes')}</GridItem>
                  <GridItem colSpan={4} textAlign="center">{t('Score')}</GridItem>
                  <GridItem colSpan={1} />
                </SimpleGrid>
                <List spacing={3}>
                {
                  votingAppchains.map((appchain, idx) => (
                    <InQueueItem index={idx} appchain={appchain} key={`appchain-${idx}`} highestVotes={highestVotes} 
                      highestScore={highestScore} /> 
                  ))
                }
                </List>
              </> :
              <NoAppchains />
            }
          </Skeleton>
        </Box>
      </Box>
      <Box mt={8}>
        <Flex justifyContent="space-between">
          <Heading fontSize="xl" color="gray">{t('Staking')}</Heading>
          <Tooltip label="Validators and Delegators can deposit OCT for the appchain in this state. (There can be only one appchain in this state)">
            <QuestionOutlineIcon color="gray" cursor="pointer" />
          </Tooltip>
        </Flex>
        <Box mt={4}>
          <Skeleton isLoaded={!!stakingAppchains}>
            {
              stakingAppchains?.length ?
              <>
                <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl={4} pr={4} pb={2} fontSize="sm">
                  <GridItem colSpan={5}>{t('ID')}</GridItem>
                  <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>{t('Validators')}</GridItem>
                  <GridItem colSpan={4}>{t('Staked')}</GridItem>
                  <GridItem colSpan={1} />
                </SimpleGrid>
                <List spacing={3}>
                {
                  stakingAppchains.map((appchain, idx) => (
                    <StagingItem appchain={appchain} key={`appchain-${idx}`} /> 
                  ))
                }
                </List>
              </> :
              <NoAppchains />
            }
          </Skeleton>
        </Box>
      </Box>
      <Box mt={8}>
        <Flex justifyContent="space-between">
          <Heading fontSize="xl" color="gray">{t('Booting')}</Heading>
          <Tooltip label="Booting appchains">
            <QuestionOutlineIcon color="gray" cursor="pointer" />
          </Tooltip>
        </Flex>
        <Box mt={4}>
          <Skeleton isLoaded={!!bootingAppchains}>
            {
              bootingAppchains?.length ?
              <>
                <SimpleGrid columns={{ base: 13, md: 17 }} color="gray" pl={4} pr={4} pb={2} fontSize="sm">
                  <GridItem colSpan={5}>{t('ID')}</GridItem>
                  <GridItem colSpan={4}>{t('Validators')}</GridItem>
                  <GridItem colSpan={4}>{t('Staked')}</GridItem>
                  <GridItem colSpan={4} display={{ base: 'none', md: 'block' }} />
                </SimpleGrid>
                <List spacing={3}>
                {
                  bootingAppchains.map((appchain, idx) => (
                    <BootingItem appchain={appchain} key={`appchain-${idx}`} /> 
                  ))
                }
                </List>
              </> :
              <NoAppchains />
            }
          </Skeleton>
        </Box>
      </Box>
    </Container>
    <Drawer placement="right" isOpen={!isLoadingList && !!id} onClose={onDrawerClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="xl"></Heading>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
        </DrawerHeader>
        <Overview appchainId={id} />
      </DrawerContent>
    </Drawer>
    </>
  );
}

export default Appchains;