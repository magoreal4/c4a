import anime from 'animejs/lib/anime.es.js';
document.addEventListener("DOMContentLoaded", function () {

    /* ---------------------------------------------- /*
 * Initialization General Scripts for all pages
 /* ---------------------------------------------- */

    var homeSection = $('#banner'),
        // captionContent = $('.caption-content'),
        // posTop = $('.caption-content').offset().top,
        navbar = $('nav'),
        navChange = false,
        navHeight = navbar.height();
    //  worksgrid   = $('#works-grid'),
    //  width       = Math.max($(window).width(), window.innerWidth),
    //  mobileTest  = false;


    // console.log(homeSection);
    // console.log(posTop);
    // console.log(navHeight);

    $(window).scroll(function () {
        effectsHomeSection(homeSection, this);
        // navbarAnimation(navbar, homeSection, navHeight);
    });


    function effectsHomeSection(homeSection, scrollTopp) {

        if (homeSection.length > 0) {
            let homeSHeight = homeSection.height();
            let topScroll = $(document).scrollTop();
            if ((homeSection.hasClass('home-parallax')) && ($(scrollTopp).scrollTop() <= homeSHeight)) {
                homeSection.css('top', (topScroll * 0.55));
            }
            if (homeSHeight - navHeight <= $(scrollTopp).scrollTop()) {
                if (!navChange) {
                    navbar.addClass('bg-brand');
                    navChange = true;
                }
            } else {
                if (navChange) {
                    navbar.removeClass('bg-brand');
                    navChange = false;
                }
            }
        }
    }

    var tl = anime.timeline({
        easing: 'easeOutExpo',
    });
    tl.add({
        targets: '#izq',
        translateX: ['-200%', 0],
        duration: 4000
    });
    tl.add({
        targets: '#der',
        translateX: ['200%', 0],
        duration: 4000
    }, '-=4000');
    tl.add({
        targets: '.animeLogo',
        opacity: [0, 1],
        duration: 4000
    }, '-=1000');
});
