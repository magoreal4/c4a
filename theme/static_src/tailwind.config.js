module.exports = {
    content: [
        // '../templates/**/*.html',
        // '../../templates/**/*.html',
        // '../../templates/*.html',
        // '../../templates/**/*.html',
        '../../**/templates/**/*.html',
        // '../../**/templates/**/**/*.html',
        '../../home/*.js',
    ],
    daisyui: {
        styled: true,
        themes: false,
        base: true,
        utils: true,
        logs: true,
        rtl: false,
        prefix: "",
        darkTheme: "dark",
        themes: [
            {
                mytheme: {
                    "primary": "#0070B8",
                    "secondary": "#DA8276",
                    "accent": "#B03F5B",
                    "neutral": "#2D304E",
                    "base-100": "#F2F0F2",
                    "info": "#90cbd4",
                    "success": "#219C6F",
                    "warning": "#fdcb10",
                    "error": "#F3393D",
                },
            },
        ],
    },


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
            inset: {
                '2/100': '2%',
            },
            translate: {
                '1/10': '10%',
            },
            height: {
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
        require("daisyui"),
        // require('@tailwindcss/line-clamp'),
    ],
}
