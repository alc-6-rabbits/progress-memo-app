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

                // TCC Static Colors (Vivid Blue / Cyber Theme)
                'tcc-bg': '#050d1e',
                'tcc-panel': '#0a1a35',
                'tcc-border': '#1a7abf',
                'tcc-text': '#a8d8f0',
                'tcc-hi': '#96ecff',
                'tcc-warn': '#f5a623',
                'tcc-critical': '#c0024bff',
                'tcc-dim': '#0d2240',
                'tcc-glow': '#1aa8d4',
                'tcc-nebula': '#061428',
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
