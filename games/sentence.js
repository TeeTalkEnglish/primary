// --------------------
// Read URL
// --------------------

const params = new URLSearchParams(window.location.search);

const grade = params.get("grade");
const unit = params.get("unit");

document.getElementById("backBtn").href =
    `../grade${grade}/unit.html?unit=${unit}`;
// --------------------
// Sounds
// --------------------

const clickSound = new Audio("../assets/sounds/click.mp3");
const successSound = new Audio("../assets/sounds/success.mp3");
const wrongSound = new Audio("../assets/sounds/wrong.mp3");

function play(sound) {
    sound.currentTime = 0;
    sound.play();
}

// --------------------
// Variables
// --------------------

let questions = [];
let currentIndex = 0;

let currentQuestion;

let answer = [];

let shuffled = [];

// --------------------
// Shuffle
// --------------------

function shuffle(array) {

    return [...array].sort(() => Math.random() - 0.5);

}

// --------------------
// Load JSON
// --------------------

fetch(`../assets/data/grade${grade}/unit${unit}.json`)
.then(response => response.json())
.then(data => {

    questions = shuffle(data.sentences);

    nextQuestion();

});

// --------------------
// Next Question
// --------------------

function nextQuestion() {

    if (currentIndex >= questions.length) {

        document.getElementById("emoji").textContent = "🏆";

        document.getElementById("answer").innerHTML = "";

        document.getElementById("words").innerHTML = "";

        document.getElementById("message").innerHTML =
            "🎉 Homework Complete!";

        updateProgress();

        document.getElementById("nextBtn").style.display = "none";

        document.getElementById("resetBtn").style.display = "none";

        return;

    }

    currentQuestion = questions[currentIndex];

    answer = [];

    shuffled = shuffle(
        currentQuestion.text.split(" ")
    );

    render();

}

// --------------------
// Render
// --------------------

function render() {

    document.getElementById("emoji").textContent =
        currentQuestion.emoji;

    document.getElementById("message").textContent = "";

    renderAnswer();

    renderWords();

    updateProgress();

    document.getElementById("nextBtn").style.display = "none";

}

// --------------------
// Answer Boxes
// --------------------

function renderAnswer() {

    const area = document.getElementById("answer");

    area.innerHTML = "";

    const words = currentQuestion.text.split(" ");

    words.forEach((word, index) => {

        area.innerHTML += `
            <div class="slot">
                ${answer[index] || ""}
            </div>
        `;

    });

}

// --------------------
// Word Buttons
// --------------------

function renderWords() {

    const area = document.getElementById("words");

    area.innerHTML = "";

    shuffled.forEach(word => {

        const btn = document.createElement("button");

        btn.className = "word";

        btn.textContent = word;

        btn.onclick = () => {

            play(clickSound);

            answer.push(word);

            btn.disabled = true;

            renderAnswer();

            check();

        };

        area.appendChild(btn);

    });

}

// --------------------
// Check Answer
// --------------------

function check() {

    if (
        answer.length <
        currentQuestion.text.split(" ").length
    ) return;

    if (
        answer.join(" ") === currentQuestion.text
    ) {

        play(successSound);

        document.getElementById("message").textContent =
            "🎉 Great Job!";

        currentIndex++;

        updateProgress();

        document.getElementById("nextBtn").style.display = "inline-block";

    }
    else {

        play(wrongSound);

        document.getElementById("message").textContent =
            "❌ Try Again";

    }

}

// --------------------
// Progress
// --------------------

function updateProgress() {

    const percent = Math.round(
        currentIndex / questions.length * 100
    );

    document.getElementById("progressFill").style.width =
        percent + "%";

    document.getElementById("progressText").textContent =
        `Homework Progress: ${currentIndex} / ${questions.length} (${percent}%)`;

}

// --------------------
// Buttons
// --------------------

document.getElementById("resetBtn").onclick = () => {

    answer = [];

    render();

};

document.getElementById("nextBtn").onclick = () => {

    nextQuestion();

};