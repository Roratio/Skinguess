/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'er-primary': '#facc15', // Example Gold
                'er-bg': '#0f0f13',
                'er-card': '#1e1e24',
            }
        },
    },
    plugins: [],
}
