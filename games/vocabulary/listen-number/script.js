// --------------------
// URL
// --------------------

const params = new URLSearchParams(window.location.search);

const grade = params.get("grade");
const unit = params.get("unit");

// --------------------
// Sounds
// --------------------

const clickSound =
new Audio("../../assets/sounds/click.mp3");

const successSound =
new Audio("../../assets/sounds/success.mp3");

const wrongSound =
new Audio("../../assets/sounds/wrong.mp3");

function play(sound){

    sound.currentTime = 0;
    sound.play();

}

// --------------------
// Variables
// --------------------

let vocabulary = [];

let currentChoices = [];

let currentAnswer = null;

let currentIndex = 0;

// --------------------
// Load JSON
// --------------------

fetch(`../../assets/data/grade${grade}/unit${unit}.json`)
.then(res=>res.json())
.then(data=>{

    vocabulary = shuffle(data.vocabulary);

    nextQuestion();

});

// --------------------
// Shuffle
// --------------------

function shuffle(array){

    return [...array].sort(()=>Math.random()-0.5);

}

// --------------------
// Next Question
// --------------------

function nextQuestion(){

    if(currentIndex >= vocabulary.length){

        finishHomework();
        return;

    }

    document.getElementById("message").textContent="";

    document.getElementById("nextBtn").style.display="none";

    currentAnswer = vocabulary[currentIndex];

    currentChoices = shuffle([
        currentAnswer,
        ...shuffle(
            vocabulary.filter(
                w=>w.id!==currentAnswer.id
            )
        ).slice(0,3)
    ]);

    renderChoices();

    updateProgress();

}

// --------------------
// Render
// --------------------

function renderChoices(){

    const area =
    document.getElementById("choices");

    area.innerHTML="";

    currentChoices.forEach((item,index)=>{

        const card =
        document.createElement("div");

        card.className="choice-card";

        card.innerHTML=`

        <div class="choice-number">

            ${index+1}

        </div>

        <img
        src="../../assets/images/vocabulary/grade${grade}/unit${unit}/${item.image}"
        alt="${item.word}">

        `;

        card.onclick=()=>{

            checkAnswer(item,card);

        };

        area.appendChild(card);

    });

}

// --------------------
// Check
// --------------------

function checkAnswer(item,card){

    play(clickSound);

    if(item.id===currentAnswer.id){

        play(successSound);

        card.classList.add("correct");

        document.getElementById("message").textContent=
        "🎉 Great Job!";

        document.getElementById("nextBtn").style.display=
        "inline-block";

    }

    else{

        play(wrongSound);

        card.classList.add("wrong");

        document.getElementById("message").textContent=
        "❌ Try Again";

    }

}

// --------------------
// Replay Audio
// --------------------

document.getElementById("playBtn").onclick=()=>{

    const audio=
    new Audio(
`../../assets/audio/grade${grade}/unit${unit}/${currentAnswer.audio}`
    );

    audio.play();

};

document.getElementById("replayBtn").onclick=()=>{

    document.getElementById("playBtn").click();

};

// --------------------
// Hint
// --------------------

document.getElementById("hintBtn").onclick=()=>{

    document.getElementById("message").textContent=
    "💡 "+currentAnswer.word;

};

// --------------------
// Next
// --------------------

document.getElementById("nextBtn").onclick=()=>{

    currentIndex++;

    nextQuestion();

};

// --------------------
// Progress
// --------------------

function updateProgress(){

    const percent=Math.round(

        currentIndex /
        vocabulary.length *100

    );

    document.getElementById("progressFill").style.width=
    percent+"%";

    document.getElementById("progressText").textContent=
`Homework Progress: ${currentIndex}/${vocabulary.length} (${percent}%)`;

}

// --------------------
// Finish
// --------------------

function finishHomework(){

    document.getElementById("choices").innerHTML="";

    document.getElementById("message").innerHTML=
    "🏆 Homework Complete!";

    document.getElementById("playBtn").style.display="none";

    document.getElementById("replayBtn").style.display="none";

    document.getElementById("hintBtn").style.display="none";

    document.getElementById("nextBtn").style.display="none";

}