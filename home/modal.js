// Crear toast con diferentes variabes para los mensajes
export function createModal(id, titulo, subtitle, introduction) {
    console.log("aaaaaaaaaaa");
    var div = document.createElement('div');
    div.id = 'modal-4';
    div.setAttribute('class', 'eee');
    div.innerHTML = `  
    <input type="checkbox" id="modal-4" class="modal-toggle" />
    <label for="modal-4" class="modal cursor-pointer">
      <label class="modal-box relative" for="">
        <h3 class="text-lg font-bold">Congratulations random Internet user!</h3>
        <p class="py-4">You've been selected for a chance to get one year of subscription to use Wikipedia for free!</p>
      </label>
    </label>
`

    document.body.appendChild(div);
}

{/* <div class="modal-box relative">
<div class="btn btn-sm btn-circle absolute right-2 top-2">✕</div>
<p class="font-bold text-primary text-xl">${titulo}</p>
<p class="font-bold text-secondary text-lg">${subtitle}</p>
<p class="py-4">${introduction}</p>
    <div class="modal-action">
    <label for="modalServices" class="btn btn-primary">Read more...</label>
    </div>
</div> */}


    // posicion === 'top' ? posicion = 'absolute top-2 left-1/2 transform -translate-x-1/2' : null
    // posicion === 'bottom' ? posicion = 'absolute bottom-24 left-1/2 transform -translate-x-1/2' : posicion = 'absolute centrearXY';

    // var div = document.createElement('div');
    // div.id = id;
    // div.setAttribute('class', posicion + ' ' + 'z-[1010] flex justify-between w-full max-w-sm mx-auto bg-white rounded-lg shadow-md opacity-90');
    // div.innerHTML = `
    //       <div class="flex items-center justify-center w-12 bg-${color}">
    //       ${icon}
    //       </div>
    //       <div class="px-4 py-2 mr-auto">
    //           <div class="mx-3">
    //           <span class="font-semibold text-${color}">${titulo}</span>
    //           <p class="text-sm ">${texto}</p>
    //           </div>
    //       </div>
    //       <button id="cancel${id}" type="button" class="flex items-center justify-center w-12 cursor-pointer">
    //           <svg class="w-4 h-4 mr-2 fill-current" viewBox="0 0 512 512">
    //               <path fill="currentColor"
    //               d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z">
    //               </path>
    //           </svg>
    //       </button>`;
    // document.body.appendChild(div);



