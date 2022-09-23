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
                    navbar.addClass('bg-primary');
                    navChange = true;
                }
            } else {
                if (navChange) {
                    navbar.removeClass('bg-primary');
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
    // tl.add({
    //     targets: '.logoEffects .left',
    //     opacity: 1,
    //     duration: 0,
    //     scaleY:0,
    //     translateX:"3.6em",
    //   }).add({
    //     targets: '.logoEffects .right',
    //     opacity: 1,
    //     duration: 0,
    //     scaleY:0,
    //     translateX:"-3.6em",
    //   });

    //   tl.add({
    //     targets: '.logoEffects .left',
    //     scaleY: [0, 1],
    //     easing: "easeInOutExpo",
    //     duration: 1800,
    //   }, '-=1000').add({
    //     targets: '.logoEffects .right',
    //     scaleY: [0, 1],
    //     easing: "easeInOutExpo",
    //     duration: 1800,
    //   }, '-=1800');

    // tl.add({
    //     targets: '.logoEffects .left',
    //     opacity: 1,
    //     duration: 0,
    //     scaleY:0,
    //     translateX:"3.6em",
    //   }).add({
    //     targets: '.logoEffects .right',
    //     opacity: 1,
    //     duration: 0,
    //     scaleY:0,
    //     translateX:"-3.6em",
    //   })

    //   tl.add({
    //     targets: '.logoEffects .left',
    //     scaleY: [0, 1],
    //     easing: "easeInOutExpo",
    //     duration: 1800,
    //   }).add({
    //     targets: '.logoEffects .right',
    //     scaleY: [0, 1],
    //     easing: "easeInOutExpo",
    //     duration: 1800,
    //   }, '-=1800');

    //   tl.add({
    //     targets: '.logoEffects .left',
    //     translateX: 0,
    //     easing: "easeInOutExpo",
    //     duration: 1600,
    //   }).add({
    //     targets: '.logoEffects .right',
    //     translateX: 0,
    //     easing: "easeInOutExpo",
    //     duration: 1600,
    //   }, '-=1600');

    //   tl.add({
    //     targets: '.logoEffects .texto',
    //     opacity: [0,1],
    //     scaleX: [0,1],
    //     easing: "easeOutExpo",
    //     duration: 1200,
    //   }, '-=1000')

    // const element = services.querySelector('.card-objetivo');
    // element.addEventListener('click', handeClick);

    // function handeClick(e) {
    //     console.log(e);
    // }

    var urlService;
    services.addEventListener("click", e => {
        if (e.target.closest('.card-objetivo')) {
            let servicio = e.target.parentNode.parentNode.parentNode.parentNode;
            
            let title = servicio.getElementsByTagName("h2")[0].innerText;
            let modalTitle = modalServices.getElementsByTagName("h3");
            modalTitle[0].innerHTML = title;

            let subtitle = servicio.getElementsByTagName("h4")[0].innerText;
            let modalSubtitle = modalServices.getElementsByTagName("h4");
            modalSubtitle[0].innerHTML = subtitle;

            let content = servicio.getElementsByClassName("service-content")[0].innerText;
            let modalContent = modalServices.getElementsByTagName("p");
            modalContent[0].innerHTML = content;

            urlService = servicio.getElementsByClassName("urlService")[0].innerText;
   
            
        }


    });

    let btn = document.getElementById("modal-1-btn");
    btn.addEventListener('click', e => {
        document.getElementById('modal-1').checked = false;
        window.location = urlService;
    });

 

    // function myFunction() {
    //     alert("The function 'test' is executed");
    //   }

    // if (e.target.closest('.card-objetivo')) {
    //     let servicio = e.target.parentNode.parentNode;
    //     let id = servicio.getElementsByTagName("label");
    //     let title = servicio.getElementsByTagName("h1");
    //     let subtitle = servicio.getElementsByTagName("h2");
    //     let content = servicio.getElementsByClassName("service-content");
    //     console.log(id);
    //     // let introduction = servicio.getElementsByTagName("h1").titulo[0].innerText;
    //     // console.log(titulo.innerText);
    //     createModal(title[0].innerText, subtitle[0].innerText, content[0].innerText);

    //   }

    // });



    // console.log(services.querySelectorAll("card-objetivo"));
    // a.addEventListener("click", event => {
    //     console.log(event);
    // })

    // .addEventListener("click", () => {
    //     console.log('hola');
    // });

    // onclick('show.bs.modal', function (e) {
    //     let $trigger = $(e.relatedTarget);
    //     alert($trigger.data('button'));
    // })
    // modalServices.classList.add("modal-open");

});
