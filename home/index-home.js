import anime from "animejs/lib/anime.es.js";
import Rellax from "rellax";
import "flowbite";

document.addEventListener("DOMContentLoaded", function () {
  var rellax = new Rellax(".rellax");

  /* ---------------------------------------------- /*
 * Initialization General Scripts for all pages
 /* ---------------------------------------------- */

  var homeSection = $("#banner"),
    // captionContent = $('.caption-content'),
    // posTop = $('.caption-content').offset().top,
    navbar = $("nav"),
    navChange = false,
    navHeight = navbar.height();
  //  worksgrid   = $('#works-grid'),
  //  width       = Math.max($(window).width(), window.innerWidth),
  //  mobileTest  = false;

  // var textWrapper = document.querySelector('.commons');
  // textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

  $(window).scroll(function () {
    effectsHomeSection(homeSection, this);
    // navbarAnimation(navbar, homeSection, navHeight);
  });

  function effectsHomeSection(homeSection, scrollTopp) {
    if (homeSection.length > 0) {
      let homeSHeight = homeSection.height();


      if (homeSHeight - navHeight <= $(scrollTopp).scrollTop()) {
        if (!navChange) {
          navbar.addClass("bg-brand");
          navChange = true;
        }
      } else {
        if (navChange) {
          navbar.removeClass("bg-brand");
          navChange = false;
        }
      }
    }
  }

  var tl = anime.timeline({
    easing: "easeOutExpo",
  });
  tl.add({
    targets: "#izq",
    translateX: ["-200%", 0],
    duration: 4000,
  });
  tl.add(
    {
      targets: "#der",
      translateX: ["200%", 0],
      duration: 4000,
    },
    "-=4000");
  // tl.add({
  //   targets: ' .letter',
  //   translateX: [-400,0],
  //   translateZ: 0,
  //   // opacity: [0,1],
  //   easing: "easeOutExpo",
  //   duration: 1200,
  //   delay: (el, i) => 500 + 30 * i
  // },
  // "-=2000");

  var textcommons = document.querySelector('.commons');
  var textall = document.querySelector('.all');
  textcommons.innerHTML = textcommons.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
  textall.innerHTML = textall.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
  
  var tl2 = anime.timeline();
  tl2.add({
      targets: '.commons .letter',
      translateX: [-400,0],
      translateZ: 0,
      opacity: [0,1],
      easing: "easeOutExpo",
      duration: 3500,
      delay: (el, i) => 500 - 60 * i
    });
    tl2.add({
      targets: '.all .letter',
      translateX: [+400,0],
      translateZ: 0,
      opacity: [0,1],
      easing: "easeOutExpo",
      duration: 3500,
      delay: (el, i) => -500 + 60 * i
    }, "-=3500");
    tl2.add({
      targets: '.four',
      translateZ: 0,
      opacity: [0,1],
      scale: [0,1],
      easing: "easeOutExpo",
      duration: 3000
    },"-=2000");


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

  var urlService;

  const targetModal = document.getElementById("modal-services");


  services.addEventListener("click", (e) => {
    if (e.target.closest(".card-objetivo")) {
      let servicio = e.target.parentNode.parentNode.parentNode;

      let title = servicio.getElementsByTagName("h2")[0].innerText;
      let modalTitle = targetModal.getElementsByTagName("h3");
      modalTitle[0].innerHTML = title;

      let subtitle = servicio.getElementsByTagName("h4")[0].innerText;
      let modalSubtitle = targetModal.getElementsByTagName("h4");
      modalSubtitle[0].innerHTML = subtitle;

      let content =
        servicio.getElementsByClassName("service-content")[0].innerText;
      let modalContent = targetModal.getElementsByTagName("p");
      modalContent[0].innerHTML = content;

      urlService = servicio.getElementsByClassName("urlService")[0].innerText;

      targetModal.classList.toggle('hidden');
      backdrop.classList.toggle('hidden');
    }
  });

  let btnClose = document.getElementById("modal-btn");
  btnClose.addEventListener('click', e => {

    targetModal.classList.toggle('hidden');
    backdrop.classList.toggle('hidden');


      // document.getElementById('modal-1').checked = false;
      // window.location = urlService;
  });

  let readMore = document.getElementById("readMore-btn");
  readMore.addEventListener('click', e => {
    // targetModal.classList.toggle('hidden');
    // backdrop.classList.toggle('hidden');


      // document.getElementById('modal-1').checked = false;
      window.location = urlService;
  });

});
