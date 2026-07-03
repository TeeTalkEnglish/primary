// ================================
// Read URL
// ================================

const params = new URLSearchParams(window.location.search);

const grade = params.get("grade");
const unit = params.get("unit");

// ================================
// Back Button
// ================================

document.getElementById("backBtn").href =
`../../grade${grade}/unit.html?unit=${unit}`;

// ================================
// Sounds
// ================================

const clickSound = new Audio("../../assets/sounds/click.mp3");
const successSound = new Audio("../../assets/sounds/success.mp3");
const wrongSound = new Audio("../../assets/sounds/wrong.mp3");

function play(sound){

    sound.currentTime = 0;
    sound.play();

}

// ================================
// Variables
// ================================

let words = [];

let current = 0;

let currentWord;

let answer = [];

let letters = [];

// ================================
// Load JSON
// ================================

fetch(`../../assets/data/grade${grade}/unit${unit}.json`)
.then(res=>res.json())
.then(data=>{

    document.getElementById("unitTitle").textContent =
        data.title;

    words = shuffle(data.vocabulary);

    loadWord();

});

// ================================
// Shuffle
// ================================

function shuffle(array){

    return [...array].sort(()=>Math.random()-0.5);

}

// ================================
// Load Word
// ================================

function loadWord(){

    if(current >= words.length){

        finishHomework();

        return;

    }

    currentWord = words[current];

    answer = [];

    letters = shuffle(currentWord.word.split(""));

    render();

}

// ================================
// Render
// ================================

function render(){

    document.getElementById("emoji").textContent =
        currentWord.emoji;

    document.getElementById("wordImage").src =
`../../assets/images/grade${grade}/unit${unit}/${currentWord.image}`;

    document.getElementById("message").textContent = "";

    renderAnswer();

    renderLetters();

    updateProgress();

    document.getElementById("nextBtn").style.display =
        "none";

}

// ================================
// Answer
// ================================

function renderAnswer(){

    const area =
        document.getElementById("answer");

    area.innerHTML = "";

    for(let i=0;i<currentWord.word.length;i++){

        area.innerHTML +=
`
<div class="slot">

${answer[i] || ""}

</div>
`;

    }

}

// ================================
// Letters
// ================================

function renderLetters(){

    const area =
        document.getElementById("letters");

    area.innerHTML = "";

    letters.forEach(letter=>{

        const btn =
            document.createElement("button");

        btn.className = "letter";

        btn.textContent = letter;

        btn.onclick = ()=>{

            play(clickSound);

            answer.push(letter);

            btn.disabled = true;

            renderAnswer();

            check();

        };

        area.appendChild(btn);

    });

}

// ================================
// Check
// ================================

function check(){

    if(answer.length < currentWord.word.length)
        return;

    if(answer.join("") === currentWord.word){

        play(successSound);

        document.getElementById("message").textContent =
            "🎉 Excellent!";

        current++;

        updateProgress();

        document.getElementById("nextBtn").style.display =
            "block";

    }

    else{

        play(wrongSound);

        document.getElementById("message").textContent =
            "❌ Try Again";

    }

}

// ================================
// Reset
// ================================

document.getElementById("resetBtn").onclick=()=>{

    answer=[];

    letters = shuffle(currentWord.word.split(""));

    render();

};

// ================================
// Hint
// ================================

document.getElementById("hintBtn").onclick=()=>{

    if(answer.length===0){

        answer.push(currentWord.word[0]);

        renderAnswer();

    }

};

// ================================
// Next
// ================================

document.getElementById("nextBtn").onclick=()=>{

    loadWord();

};

// ================================
// Progress
// ================================

function updateProgress(){

    const percent =
Math.round(
(current/words.length)*100
);

    document.getElementById("progressFill").style.width =
percent+"%";

    document.getElementById("progressText").textContent =
`Homework Progress ${current}/${words.length} (${percent}%)`;

}

// ================================
// Finish
// ================================

function finishHomework(){

document.getElementById("emoji").textContent="🏆";

document.getElementById("wordImage").style.display="none";

document.getElementById("letters").innerHTML="";

document.getElementById("answer").innerHTML="";

document.getElementById("message").innerHTML=
`
🎉 Homework Complete!
`;

updateProgress();

document.getElementById("nextBtn").style.display="none";

document.getElementById("resetBtn").style.display="none";

document.getElementById("hintBtn").style.display="none";

}

// ================================
// Listen
// ================================

document.getElementById("listenBtn").onclick=()=>{

const audio=new Audio(
`../../assets/audio/grade${grade}/unit${unit}/${currentWord.audio}`
);

audio.play();

};