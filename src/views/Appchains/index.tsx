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
  Fade,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverBody,
  PopoverFooter,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  useBoolean
} from '@chakra-ui/react';

import { BOATLOAD_OF_GAS } from 'utils';
import { FiPlus } from 'react-icons/fi';
import { BiBadgeCheck } from 'react-icons/bi';
import { BsFillStopFill, BsPeople } from 'react-icons/bs';
import { FaRegEdit } from 'react-icons/fa';
import { GoTasklist } from 'react-icons/go';
import { VscServerProcess } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
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

const appchainStates = ['registered', 'inqueue', 'staging', 'booting'];

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
  const [numStaging, setNumStaging] = useState<string|number>('');
  const [numBooting, setNumBooting] = useState<string|number>('');
  const [isCounting, setIsCounting] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [concludePopoverOpen, setConcludePopoverOpen] = useBoolean(false);

  const [appchains, setAppchains] = useState<any[]|null>();
  const [tabIndex, setTabIndex] = useState(appchainStates[state]);
  const [votingResultReductionPercent, setVotingResultReductionPercent] = useState(Math.ceil(Math.random()*100));

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
      setNumRegistered((registeredCount*1 + auditingCount*1 + deadCount*1));
      setNumInQueue(inQueueCount);
      setNumStaging(stagingCount);
      setNumBooting(bootingCount);
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
      states = ['Staging'];
    } else if (tabIndex === 3) {
      states = ['Booting'];
    }

    window
      .registryContract
      .get_appchains_with_state_of({ 
        appchain_state: states,
        page_number: 1,
        page_size: 20,
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

  useEffect(() => {
    if (concludePopoverOpen) {
      setVotingResultReductionPercent(Math.ceil(Math.random()*100));
    }
  }, [concludePopoverOpen]);

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
    window
      .registryContract
      .count_voting_score().then(() => {
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
        BOATLOAD_OF_GAS
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
          <SimpleGrid columns={{ base: 2, md: 4 }}>
            <StatBox title={t('registered')} value={numRegistered} icon={FaRegEdit} color="green"
              tooltip="The appchains have registered, or in auditing/dead state." />
            <StatBox title={t('inqueue')} value={numInQueue} icon={GoTasklist} color="teal"
              tooltip="Audited applications. It's up to the community to decide whether they move to the next stage by voting." />
            <StatBox title={t('staging')} value={numStaging} icon={BsPeople} color="orange"
              tooltip="Validators can stake on the appchains in this state." />
            <StatBox title={t('booting')} value={numBooting} icon={VscServerProcess} color="blue" />
          </SimpleGrid>
        </Box>
        {/* <Box boxShadow="octoShadow" p="6" borderRadius="10" ml="6">
          <Flex>
            <Box display="flex" alignItems="flex-end" flexDirection="column" mr="2">
              <Text color="gray" fontSize="sm">Next Epoch</Text>
              <Heading fontSize="xl" mt="1">2 days</Heading>
            </Box>
            <CircularProgress value={40} color="green.400" size="14">
              <CircularProgressLabel>40%</CircularProgressLabel>
            </CircularProgress>
          </Flex>
        </Box> */}
      </Flex>
      <Box mt="8" minH="50vh">
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
          <Fade in={tabIndex === 1 && isAdmin && appchains?.length > 0}>
          <HStack spacing={3}>
            <Button size="sm" disabled={isCounting || isConcluding} 
              display={{ base: 'none!important', md: 'block!important' }} isLoading={isCounting} onClick={onCount}>
              <Icon as={BiBadgeCheck} mr="1" /> Count score
            </Button>
            <Button size="sm" colorScheme="red" display={{ base: 'none!important', md: 'block!important' }} 
              disabled={isCounting || isConcluding || concludePopoverOpen} isLoading={isConcluding} 
              onClick={onConclude}>
              <Icon as={BsFillStopFill} mr="1" /> Conclude score
            </Button>
            {/* <Popover
              initialFocusRef={initialFocusRef}
              placement="bottom"
              isOpen={concludePopoverOpen}
              onClose={setConcludePopoverOpen.off}
            >
              <PopoverTrigger>
                <Button size="sm" colorScheme="red" disabled={isCounting || isConcluding || concludePopoverOpen} isLoading={isConcluding} 
                  onClick={setConcludePopoverOpen.toggle}>
                  <Icon as={BsFillStopFill} mr="1" /> Conclude score
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverCloseButton />
                <PopoverBody>
                  <VStack alignItems="flex-start">
                    <Heading fontSize="md">Vote result reduction percent</Heading>
                    <Box p="2" w="100%">
                      <Slider value={votingResultReductionPercent} min={0} max={100} step={1} 
                        onChange={value => setVotingResultReductionPercent(value)}>
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
                    Reduction percent {votingResultReductionPercent}%
                  </Text>
                  <Button colorScheme="red" size="sm" onClick={onConclude}>Confirm</Button>
                </PopoverFooter>
              </PopoverContent>
            </Popover> */}
          </HStack>
          </Fade>
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
              <GridItem colSpan={6} 
                display={{ base: 'none', md: 'block' }}>{t('Votes')}</GridItem>
              <GridItem colSpan={3}>{t('Voting Score')}</GridItem>
              <GridItem colSpan={1} />
            </SimpleGrid> :
            tabIndex === 2 ?
            <SimpleGrid columns={{ base: 14, md: 14 }} color="gray" pl="6" pr="6" pb="2" fontSize="sm">
              <GridItem colSpan={5}>{t('ID')}</GridItem>
              <GridItem colSpan={4}>{t('Validators')}</GridItem>
              <GridItem colSpan={4}>{t('Staked')}</GridItem>
              <GridItem colSpan={1} display={{ base: 'none', md: 'block' }} />
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
              tabIndex === 2 ?
              <RouterLink to={`/appchains/${state}/${appchain.appchain_id}`}>
                <StagingItem appchain={appchain} key={`appchain-${idx}`} />
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