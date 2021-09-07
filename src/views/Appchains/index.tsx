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
  DrawerHeader,
  CloseButton,
  PopoverTrigger,
  PopoverContent,
  UnorderedList,
  ListItem,
  useToast,
  useBoolean,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverHeader,
  PopoverFooter
} from '@chakra-ui/react';

import { COMPLEX_CALL_GAS } from 'config/constants';
import { FiPlus } from 'react-icons/fi';
import { BiBadgeCheck } from 'react-icons/bi';
import { BsFillStopFill, BsPeople } from 'react-icons/bs';
import { FaRegEdit } from 'react-icons/fa';
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

import NoData from 'components/NoData';
import Overview from './Overview';
import octopusConfig from 'config/octopus';

const StatBox = ({
  title,
  tooltip,
  value,
  icon,
  color,
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
        <Box w="48px" h="48px" borderRadius="24px" bg={`${color||'gray'}.100`} display={{ base: 'none', md: 'flex' }}
          alignItems="center" justifyContent="center" mr="2">
          <Icon as={icon} w="20px" h="20px" color={color} />
        </Box>
        <VStack alignItems="start" spacing={1}>
          <HStack color="gray" fontSize="sm">
            <Text>{title}</Text>
            {
              tooltip &&
              <Tooltip label={tooltip}>
                <QuestionOutlineIcon cursor="pointer" />
              </Tooltip>
            }
          </HStack>
          <Skeleton isLoaded={value !== ''}>
            <Heading fontSize={{ base: 'lg', md: '2xl' }}>{value !== '' ? value : 'loading'}</Heading>
          </Skeleton>
        </VStack>
      </HStack>
    </Box>
  );
}

const appchainStates = ['registered', 'inqueue', 'booting'];

const Appchains = () => {
  
  let { state, appchainId } = useParams();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  
  if (!state && !appchainId) {
    state = location.pathname.split('/').pop();
  }

  const isAdmin = window.accountId && (
    new RegExp(`\.${window.accountId}`).test(octopusConfig.registryContractId) ||
    window.accountId === octopusConfig.registryContractId
  );

  const [numRegistered, setNumRegistered] = useState<string|number>('');
  const [numInQueue, setNumInQueue] = useState<string|number>('');
  const [numBooting, setNumBooting] = useState<string|number>('');
  const [isCounting, setIsCounting] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [countPopoverOpen, setCountPopoverOpen] = useBoolean(false);
  const [concludePopoverOpen, setConcludePopoverOpen] = useBoolean(false);

  const [appchains, setAppchains] = useState<any[]|null>();
  const [tabIndex, setTabIndex] = useState(appchainStates[state]);
  const [stagingAppchainLoading, setStagingAppchainLoading] = useState(true);
  const [stagingAppchain, setStagingAppchain] = useState<any>();

  const initialFocusRef = React.useRef();

  useEffect(() => {
    const promises = [
      'Registered', 'Auditing', 'Dead', 'InQueue', 'Booting'
    ].map(state => window.registryContract.get_appchains_count_of({
      appchain_state: state
    }));

    Promise.all(promises).then(([
      registeredCount, auditingCount, deadCount, inQueueCount, bootingCount
    ]) => {
      setNumRegistered((registeredCount*1 + auditingCount*1 + deadCount*1));
      setNumInQueue(inQueueCount);
      setNumBooting(bootingCount);
    });

    window
      .registryContract
      .get_appchains_with_state_of({ 
        appchain_state: ['Staging'],
        page_number: 1,
        page_size: 10,
        sorting_field: 'RegisteredTime',
        sorting_order: 'Descending'
      }).then(([appchain]) => {
        setStagingAppchainLoading(false);
        setStagingAppchain(appchain);
      }).catch(err => {
        console.log(err);
      });
    
  }, []);

  useEffect(() => {
    if (tabIndex === undefined) return;
    let states;

    if (tabIndex === 0) {
      states = ['Registered', 'Auditing', 'Dead'];
    } else if (tabIndex === 1) {
      states = ['InQueue'];
    } else if (tabIndex === 2) {
      states = ['Booting'];
    }

    window
      .registryContract
      .get_appchains_with_state_of({ 
        appchain_state: states,
        page_number: 1,
        page_size: 10,
        sorting_field: tabIndex === 1 ? 'VotingScore' : 'RegisteredTime',
        sorting_order: 'Descending'
      }).then((arr: any) => {
        setAppchains([].concat(...arr));
      });

  }, [tabIndex]);

  useEffect(() => {
    let idx = appchainStates.indexOf(state);
    setTabIndex(idx >= 0 ? idx : 1);
   
  }, [state]);

  const onTabChange = (idx) => {
    setAppchains(null);
    navigate(`/appchains/${appchainStates[idx]}`);
  }

  const onDrawerClose = () => {
    if (appchainStates.indexOf(state) >= 0) {
      navigate(`/appchains/${state}`);
    } else {
      navigate(`/appchains`);
    }
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
        <Heading fontSize="2xl">{t('Appchains')}</Heading>
        <RouterLink to="/appchains/join">
          <Button colorScheme="octoColor">
            <Icon as={FiPlus} mr="1" /> {t('Join')}
          </Button>
        </RouterLink>
      </Flex>
      <Flex mt="6">
        <Box boxShadow="octoShadow" p="6" borderRadius="10" flex={1}
          position="relative" overflow="hidden">
          <SimpleGrid columns={3}>
            <StatBox title={t('registered')} value={numRegistered} icon={FaRegEdit} color="green"
              tooltip="The appchains have registered, or in auditing/dead state." />
            <StatBox title={t('inqueue')} value={numInQueue} icon={GoTasklist} color="teal"
              tooltip="Audited applications. It's up to the community to decide whether they move to the next stage by voting." />
            <StatBox title={t('booting')} value={numBooting} icon={VscServerProcess} color="blue" />
          </SimpleGrid>
        </Box>
      </Flex>
      <Box mt="8">
        <Flex justifyContent="space-between">
          <Heading fontSize="2xl">{t('Staging')}</Heading>
          <Tooltip label="Validators and Delegators can deposit OCT for the appchain in this state. (There can be only one appchain in this state)">
            <QuestionOutlineIcon color="gray" cursor="pointer" />
          </Tooltip>
        </Flex>
        <Box mt="4">
          <Skeleton isLoaded={!stagingAppchainLoading}>
            {
              stagingAppchain ?
              <>
                <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl="6" pr="6" mt="3" pb="2" fontSize="sm">
                  <GridItem colSpan={5}>{t('ID')}</GridItem>
                  <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>{t('Validators')}</GridItem>
                  <GridItem colSpan={4}>{t('Staked')}</GridItem>
                  <GridItem colSpan={1} />
                </SimpleGrid>
                <RouterLink to={`/appchains/${state}/${stagingAppchain?.appchain_id}`}>
                  <StagingItem appchain={stagingAppchain} />
                </RouterLink>
              </> :
              <Box p="6" borderRadius="10" flex={1} bg="rgba(120, 120, 150, .05)">
                <Flex color="gray" flexDirection="column" justifyContent="center" alignItems="center">
                  <WarningIcon w="6" h="6" />
                  <Text mt="2">No staging appchain</Text>
                </Flex>
              </Box>
            }
          </Skeleton>
        </Box>
      </Box>
      <Box mt="8" minH="40vh">
        <Flex alignItems="center" justifyContent="space-between" minH="35px">
          <Tabs index={tabIndex} variant="soft-rounded" colorScheme="cyan" size="sm" onChange={onTabChange}>
            <TabList border="none">
              {
                appchainStates.map((state, idx) => {
                  return (
                    <Tab key={`appchain-state-${idx}`}>
                      <Text>{t(state)}</Text>
                    </Tab>
                  );
                })
              }
            </TabList>
          </Tabs>
          {
            tabIndex === 1 ?
            isAdmin ?
            <HStack spacing={3}>
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
              </Popover>
              <Popover
                initialFocusRef={initialFocusRef}
                placement="bottom"
                onClose={setConcludePopoverOpen.off}
                isOpen={concludePopoverOpen}
              >
                <PopoverTrigger>
                  <Button size="sm" colorScheme="red" display={{ base: 'none', md: 'block' }} 
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
              
            </HStack> :
            <Popover trigger="hover" placement="top">
              <PopoverTrigger>
                <Flex alignItems="center" color="gray" fontSize="sm" cursor="pointer">
                  <QuestionOutlineIcon />
                  <Text ml="1">Voting rules</Text>
                </Flex>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody>
                  <UnorderedList fontSize="sm">
                    <ListItem>$OCT holders can change the ranking of appchain by upvoting or downvoting. </ListItem>
                    <ListItem>At around 00:00 UTC each day, the octopus team’s operator counts the votes of appchains, the score on that day is the number of upvotes minus the number of downvotes. </ListItem>
                    <ListItem>After a week of voting, the appchain with the highest total score moves on to the next stage.</ListItem>
                    <ListItem>The total score of all the  other appchains will decrease by 50% when an appchain moves to the next stage. </ListItem>
                    <ListItem>The $OCT holders may withdraw his vote at any time.</ListItem>
                  </UnorderedList>
                </PopoverBody>
              </PopoverContent>
            </Popover> : null
          }
        </Flex>
        <Box mt="4">
          {
            tabIndex === 0 ?
            <SimpleGrid columns={{ base: 10, md: 14 }} color="gray" pl="6" pr="6" pb="2" fontSize="sm">
              <GridItem colSpan={5}>{t('ID')}</GridItem>
              <GridItem colSpan={4} display={{ base: 'none', md: 'block' }}>{t('Founder')}</GridItem>
              <GridItem colSpan={4}>{t('State')}</GridItem>
              <GridItem colSpan={1} />
            </SimpleGrid> :
            tabIndex === 1 ?
            <SimpleGrid columns={{ base: 9, md: 15 }} color="gray" pl="6" pr="6" pb="2" fontSize="sm">
              <GridItem colSpan={1} />
              <GridItem colSpan={4}>{t('ID')}</GridItem>
              <GridItem colSpan={6} textAlign="center"
                display={{ base: 'none', md: 'block' }}>{t('Votes')}</GridItem>
              <GridItem colSpan={3} textAlign="center">{t('Total Score')}</GridItem>
              <GridItem colSpan={1} />
            </SimpleGrid> :
            <SimpleGrid columns={{ base: 13, md: 17 }} color="gray" pl="6" pr="6" pb="2" fontSize="sm">
              <GridItem colSpan={5}>{t('ID')}</GridItem>
              <GridItem colSpan={4}>{t('Validators')}</GridItem>
              <GridItem colSpan={4}>{t('Staked')}</GridItem>
              <GridItem colSpan={4} display={{ base: 'none', md: 'block' }} />
            </SimpleGrid>
          }
          <VStack spacing={6} align="stretch" mt="2">
          {
            appchains ?
            appchains.length ?
            appchains.map((appchain, idx) => (
              tabIndex === 0 ?
              <RouterLink to={`/appchains/${state}/${appchain.appchain_id}`}>
                <RegisteredItem appchain={appchain} key={`appchain-${idx}`} /> 
              </RouterLink> :
              tabIndex === 1 ?
              <RouterLink to={`/appchains/${state}/${appchain.appchain_id}`}>
                <InQueueItem index={idx} appchain={appchain} key={`appchain-${idx}`} />
              </RouterLink> :
              <BootingItem appchain={appchain} key={`appchain-${idx}`} />
            )) :
            <NoData /> :
            <Skeleton borderRadius="5px" isLoaded={!!appchains?.length}>
              <Box h="80px" />
            </Skeleton>
          }
          </VStack>
        </Box>
      </Box>
    </Container>
    <Drawer placement="right" isOpen={!!appchainId} onClose={onDrawerClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="0">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading fontSize="xl"></Heading>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
        </DrawerHeader>
        <Overview appchainId={appchainId} />
      </DrawerContent>
    </Drawer>
    </>
  );
}

export default Appchains;