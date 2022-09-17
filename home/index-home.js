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
        // easing: 'easeOutExpo',
    });
    // tl.add({
    //     targets: '#izq',
    //     translateX: ['-200%', 0],
    //     duration: 4000
    // });
    // tl.add({
    //     targets: '#der',
    //     translateX: ['200%', 0],
    //     duration: 4000
    // }, '-=4000');

    // tl.add({
        // targets: '.logoEffects .texto',
        // opacity: [0,1],
        // scaleX: [0, 1],
        // easing: "easeOutExpo",
        // duration: 600,
        // delay: 1800
    //   }, 800 );
    //   tl.add({
    //     targets: '.logoEffects .left',
        
    //     scaleY:0,
    //     easing: "easeOutExpo",
    //     duration: 0,
        
    //   })
    tl.add({
        targets: '.logoEffects .left',
        opacity: 1,
        duration: 0,
        scaleY:0,
        translateX:"3.6em",
      }).add({
        targets: '.logoEffects .right',
        opacity: 1,
        duration: 0,
        scaleY:0,
        translateX:"-3.6em",
      })

      tl.add({
        targets: '.logoEffects .left',
        scaleY: [0, 1],
        easing: "easeInOutExpo",
        duration: 1800,
      }).add({
        targets: '.logoEffects .right',
        scaleY: [0, 1],
        easing: "easeInOutExpo",
        duration: 1800,
      }, '-=1800');

      tl.add({
        targets: '.logoEffects .left',
        translateX: 0,
        easing: "easeInOutExpo",
        duration: 1600,
      }).add({
        targets: '.logoEffects .right',
        translateX: 0,
        easing: "easeInOutExpo",
        duration: 1600,
      }, '-=1600');

      tl.add({
        targets: '.logoEffects .texto',
        opacity: [0,1],
        scaleX: [0,1],
        easing: "easeOutExpo",
        duration: 1200,
      }, '-=1000')

      
    //   tl.add({
    //     targets: '.logoEffects .right',
    //     // opacity: [0,1],
    //     translateX: "-3.6em",
    //     easing: "easeOutExpo",
    //     duration: 800,
    //   }, '-=800');

    // tl.add({
    //     targets: '#logoEffects .cent',
    //     easing: 'easeInOutExpo',
    //     scaleX: [0,1],
    //     duration: 700
    // });



    // tl.add({
    //     targets: '#logoEffects',
    //     easing: 'easeInOutExpo',
    //     scaleX: [0, 1],
    //     duration: 700
    // });
});
