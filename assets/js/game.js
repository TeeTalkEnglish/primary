// =========================
// Shared Hint System
// =========================

// =========================
// Shared Hint System
// =========================

let getHintAnswer = null;

function setHint(callback){
    getHintAnswer = callback;
}

document.addEventListener("DOMContentLoaded",()=>{

    const hintBtn=document.getElementById("hintBtn");
    const hintText=document.getElementById("hintText");

if(hint){

    hint.textContent="";

}

    if(!hintBtn) return;

    hintBtn.onclick=()=>{

        if(!getHintAnswer) return;

        if(hintText){

            hintText.textContent="💡 " + getHintAnswer();

        }

    };

});