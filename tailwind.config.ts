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
                    50: '#FDF5F3',
                    100: '#FBEBE7',
                    200: '#F6D7CF',
                    300: '#F1C3B7',
                    400: '#E89C87',
                    500: '#E57A56', // Coral accent color from Claude screenshot
                    600: '#CA6E56',
                    700: '#A85A48',
                    800: '#86483A',
                    900: '#6E3B30',
                },
                beige: {
                    50: '#FDFCFA',
                    100: '#F9F7F4',
                    200: '#F5F3EF', // Main background beige color
                    300: '#EBE7E0',
                    400: '#E0D9CE',
                    500: '#D3C9BA',
                    600: '#B8AA95',
                    700: '#9C8E76',
                    800: '#7D7057',
                    900: '#5E5441',
                },
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            spacing: {
                '72': '18rem',
                '84': '21rem',
                '96': '24rem',
            },
            animation: {
                'fadeIn': 'fadeIn 0.2s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
    // Disable Oxide engine to fallback to stable processor
    oxide: false,
}
