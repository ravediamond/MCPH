/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#E6F6FF',
                    100: '#BADDFF',
                    200: '#90C4FF',
                    300: '#65ABFF',
                    400: '#3B93FF',
                    500: '#1178FF',
                    600: '#0060DB',
                    700: '#0049B7',
                    800: '#003393',
                    900: '#001C6F',
                },
            },
            spacing: {
                '72': '18rem',
                '84': '21rem',
                '96': '24rem',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
