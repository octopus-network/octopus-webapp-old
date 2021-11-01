import React from 'react';

import {
  Container,
  Center,
  Flex,
  Box
} from '@chakra-ui/react';

// const mainChain: MainChain = {
//   name: 'Near',
//   icon: '/images/near.svg'
// }

export const Bridge: React.FC = () => {
  // const [isReverse, setIsReverse] = useBoolean(false);

  // const [runningAppchains, setRunningAppchains] = useState([]);
  // const [appchain, setAppchain] = useState<Appchain>();

  // useEffect(() => {

  //   window
  //     .registryContract
  //     .get_appchains_with_state_of({
  //       appchain_state: ['Active'],
  //       page_number: 1,
  //       page_size: 20,
  //       sorting_field: 'RegisteredTime',
  //       sorting_order: 'Descending'
  //     })
  //     .then(appchains => {
  //       setRunningAppchains(appchains);
  //     });
  // }, []);

  // const onReverse = () => {
  //   setIsReverse.toggle();
  // }

  return (
    <Container>
      <Center mt="10vh">
        <Box boxShadow="lg" p={3} borderRadius="xl">
          <Flex>
            <Box p={3} borderRadius="xl" bg="#eee">

            </Box>
          </Flex>
        </Box>
      </Center>
    </Container>
  );
}