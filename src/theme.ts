import { extendTheme, theme as baseTheme } from '@chakra-ui/react';

const customColors = {
    ...baseTheme.colors,
    brand: {
        50: '#e6f7ff',
        100: '#bae7ff',
        200: '#91d5ff',
        300: '#69c0ff',
        400: '#40a9ff',
        500: '#1890ff',
        600: '#096dd9',
        700: '#0050b3',
        800: '#003a8c',
        900: '#002766',
    },
};

const theme = extendTheme({
    colors: customColors,
    fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
    },
    styles: {
        global: {
            body: {
                bg: 'gray.50',
            },
        },
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'semibold',
            },
            variants: {
                solid: {
                    bg: 'brand.500',
                    color: 'white',
                    _hover: {
                        bg: 'brand.600',
                    },
                },
            },
        },
    },
});

export default theme;
