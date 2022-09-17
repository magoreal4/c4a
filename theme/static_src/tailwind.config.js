/**
 * This is a minimal config.
 *
 * If you need the full config, get it from here:
 * https://unpkg.com/browse/tailwindcss@latest/stubs/defaultConfig.stub.js
 */

module.exports = {
    content: [
        // '../templates/**/*.html',
        // '../../templates/**/*.html',
        '../../templates/*.html',
        '../../templates/**/*.html',
        '../../**/templates/**/*.html',
        '../../**/templates/**/**/*.html',
        '../../home/index-home.js',
    ],
    theme: {
        extend: {
            colors: {
                "brand": "#0070B8",
                "lightAccent": "#DA8276",
                "lightShades": "#F2F0F2",
                "darkAccent": "#B03F5B",
                "darkShades": "#2D304E",
                "info": "#90cbd4",
                "success": "#6CB288",
                "warning": "#fdcb10",
                "error": "#fc483f",
                "facebook": "#3b5998",
                "whatsapp": "#25d366"
            },
            translate: {
                '57p': '50%',
              },
            height: {
                'screen70': '70vh',
                'screen90': '90vh',
            },
            dropShadow: {
                'black': '0px 0px 6px black',
            },
            fontFamily: {
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
    ],
}
