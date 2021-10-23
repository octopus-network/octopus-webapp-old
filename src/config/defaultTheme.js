import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react';

const defaultTheme = {
  colors: {
    octoColor: {
      50: '#629fff',
      100: '#508ded',
      200: '#3e7bdb',
      300: '#2c69c9',
      400: '#1a57b7',
      500: '#0845A5',
      600: '#003393',
      700: '#002181',
      800: '#000f6f',
      900: '#00005d',
    }
  },
  shadows: {
    octoShadow: '0px 4px 12px rgb(0 0 0 / 10%)'
  },
  components: {
   
    Container: {
      baseStyle: {
        maxW: 'container.lg'
      }
    },
    Link: {
      baseStyle: {
        _hover: {
          color: '#0845A5',
          textDecoration: 'none'
        },
        _focus: {
          boxShadow: 'none'
        }
      }
    },
    Tabs: {
      baseStyle: {
        'tab': {
          _focus: {
            boxShadow: 'none'
          }
        }
      }
    },
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none'
        }
      }
    },
    CloseButton: {
      baseStyle: {
        _focus: {
          boxShadow: 'none'
        }
      }
    }
  }
}

export default extendTheme(
  defaultTheme,
  withDefaultColorScheme({
    colorScheme: 'octoColor',
    components: ['Tabs']
  })
);