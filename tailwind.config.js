/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#ED6A2E',
                    50: '#FFF4ED',
                    100: '#FFE6D4',
                    200: '#FFCAA8',
                    300: '#FFA571',
                    400: '#ED6A2E',
                    500: '#D9581F',
                    600: '#B84614',
                    700: '#93350F',
                    800: '#782810',
                    900: '#5F210D',
                },
                'bg-app': '#F0F2F8',
                'bg-side': '#E8EBF4',
                'text-primary': '#0F1624',
                'text-secondary': '#7D7D7D',
                'card': '#FFFFFF',
            },
            boxShadow: {
                card: '0 2px 8px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 20px rgba(0, 0, 0, 0.12)',
            },
        },
    },
    plugins: [],
}
