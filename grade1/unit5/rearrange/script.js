const words=[

{
word:"FISH",
hint:"🐟"
},

{
word:"CHIPS",
hint:"🍟"
},

{
word:"MILK",
hint:"🥛"
},

{
word:"CHICKEN",
hint:"🍗"
}

];

const clickSound =
new Audio(
"../../../assets/sounds/click.mp3"
);

const successSound =
new Audio(
"../../../assets/sounds/success.mp3"
);

const wrongSound =
new Audio(
"../../../assets/sounds/wrong.mp3"
);

let current;

let answer=[];

let score=0;

let shuffled=[];

function play(sound){

sound.currentTime=0;

sound.play();

}

function shuffle(word){

return [...word]

.sort(

()=>Math.random()-0.5

);

}

function nextQuestion(){

current=

words[

Math.floor(

Math.random()

*

words.length

)

];

answer=[];

shuffled=

shuffle(

current.word

);

render();

}

function render(){

document

.getElementById(

"hint"

)

.innerHTML=

current.hint;

document

.getElementById(

"score"

)

.innerHTML=

`⭐ ${score}`;

document

.getElementById(

"message"

)

.innerHTML="";

renderAnswer();

renderLetters();

}

function renderAnswer(){

const box=

document

.getElementById(

"answer"

);

box.innerHTML="";

for(

let i=0;

i<

current.word.length;

i++

){

box.innerHTML+=

`

<div class="box">

${answer[i]||""}

</div>

`;

}

}

function renderLetters(){

const area=

document

.getElementById(

"letters"

);

area.innerHTML="";

shuffled.forEach(

letter=>{

const btn=

document

.createElement(

"div"

);

btn.className=

"letter";

btn.innerText=

letter;

btn.onclick=

()=>{

play(

clickSound

);

answer.push(

letter

);

btn.style.visibility=

"hidden";

renderAnswer();

check();

};

area.append(

btn

);

}

);

}

function check(){

if(

answer.length

<

current.word.length

)

return;

if(

answer.join("")

===

current.word

){

play(

successSound

);

score++;

document

.getElementById(

"message"

)

.innerHTML=

"🎉 Great Job!";

setTimeout(

nextQuestion,

1200

);

}else{

play(

wrongSound

);

document

.getElementById(

"message"

)

.innerHTML=

"❌ Try Again";

}

}

function resetWord(){

answer=[];

render();

}

nextQuestion();