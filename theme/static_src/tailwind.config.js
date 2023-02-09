module.exports = {
    content: [
        // '../templates/**/*.html',
        // '../../templates/**/*.html',
        // '../../templates/*.html',
        '../../templates/**/*.html',
        '../../**/templates/**/*.html',
        // '../../**/templates/**/**/*.html',
        '../../home/*.js',
        "./node_modules/flowbite/**/*.js",
        "../../base/templates/base/standard_page.html"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            backgroundImage: {
                'logo': "url('/media/bg.svg')",
              },
            colors: {
                'brand-light': '#ced9ed',
                'brand': '#0070b8',
                'brand-dark': '#193858',

                "light": "#F2F0F2",
                "lightAccent": "#1AA5FF",

                "dark": "#011936",
                "darkAccent": "#E54B4B",
                
                'cta-light': '#f8c8bf',
                'cta': '#b80014',
                'cta-dark': '#5b150f',
                
                'info-light': '#d8f1fc',
                'info': '#2ec6f1',
                'info-dark': '#265e71',
                
                'warning-light': '#fbf0d3',
                'warning': '#e0c54d',
                'warning-dark': '#6b5e2b',
                
                'success-light': '#d8f5d8',
                'success': '#47d465',
                'success-dark': '#2c6434',
                
                'danger-light': '#ffd4d3',
                'danger': '#e34b5b',
                'danger-dark': '#6c2a2f',

                "facebook": "#3b5998",
                "whatsapp": "#25d366"
            },
            inset: {
                '2/100': '2%',
            },
            translate: {
                '1/10': '10%',
            },
            height: {
                '120': '30rem',
                'screen70': '70vh',
                'screen90': '90vh',
            },
            dropShadow: {
                'black': '0px 0px 6px black',
            },
            fontFamily: {
                'josefin': ['Josefin Sans', 'sans-serif'],
                'poppins': ['Poppins', 'sans-serif'],
                'nunito': ['Nunito', 'sans-serif']
            },
            animation: {
                "text-flicker-in-glow": "text-flicker-in-glow 3s linear both",
                "fade-in-fwd": "fade-in-fwd 4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both",
            },

        },
    },
    plugins: [
        // require('@tailwindcss/aspect-ratio'),
        // require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        // require('@tailwindcss/line-clamp'),
        require('flowbite/plugin'),
    ],
}
