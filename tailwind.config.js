/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
    ],
    theme: {
        extend: {
            colors: {
                'ace-bg': 'rgb(var(--color-ace-bg) / <alpha-value>)',
                'ace-panel': 'rgb(var(--color-ace-panel) / <alpha-value>)',
                'ace-border': 'rgb(var(--color-ace-border) / <alpha-value>)',
                'ace-text': 'rgb(var(--color-ace-text) / <alpha-value>)',
                'ace-highlight': 'rgb(var(--color-ace-highlight) / <alpha-value>)',
                'ace-warning': 'rgb(var(--color-ace-warning) / <alpha-value>)',
                'ace-title': 'rgb(var(--color-ace-title) / <alpha-value>)',
                
                // TCC Static Colors (from wireframes)
                'tcc-bg': '#03080f',
                'tcc-panel': '#071526',
                'tcc-border': '#2a6a9a',
                'tcc-text': '#8cb4cf',
                'tcc-hi': '#bae6fd',
                'tcc-warn': '#f59e0b',
                'tcc-critical': '#ef4444',
                'tcc-dim': '#1c3a52',
            },
            fontFamily: {
                'mono': ['"Share Tech Mono"', '"Courier New"', 'Courier', 'monospace'],
                'sans': ['"Noto Sans JP"', 'sans-serif'],
            },
            backgroundImage: {
                'scanlines': 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))'
            },
            fontSize: {
                'xxs': '0.625rem',
                'tiny': '0.5rem',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
