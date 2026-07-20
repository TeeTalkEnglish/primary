// --------------------
// Read URL
// --------------------

const params = new URLSearchParams(window.location.search);

const grade = params.get("grade");
const unit = params.get("unit");

document.getElementById("backBtn").href =
`../../grade${grade}/unit.html?unit=${unit}`;

const clickSound =
new Audio("../../assets/sounds/click.mp3");

const successSound =
new Audio("../../assets/sounds/success.mp3");

const wrongSound =
new Audio("../../assets/sounds/wrong.mp3");

fetch(
`../../assets/data/grade${grade}/unit${unit}.json`
)

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

fetch(`../../assets/data/grade${grade}/unit${unit}.json`)
.then(response => response.json())
.then(data => {

    questions = shuffle(data.sentences);

    nextQuestion();

});

// --------------------
// Next Question
// --------------------

function nextQuestion() {

       console.log(
        "Current Index:",
        currentIndex,
        "Total:",
        questions.length
    );

    if (currentIndex >= questions.length) {

        finishHomework();

        return;

    }

    currentQuestion = questions[currentIndex];

    answer = [];

shuffled = shuffle(
    currentQuestion.text
        .split(" ")
        .map((word, index) => ({
            id: index,
            text: word,
            used: false
        }))
);

    render();

}

// --------------------
// Finish Homework
// --------------------

function finishHomework() {

    document.getElementById("emoji").textContent = "🏆";

    document.getElementById("answer").innerHTML = "";

    document.getElementById("words").innerHTML = "";

    document.getElementById("message").innerHTML =
        "🎉 Homework Complete!";

    updateProgress();

// --------------------
// Hide Next Button
// --------------------

bindButton("nextBtn", () => {

    nextWord();

});
// --------------------
// Button Events
// --------------------

bindButton("resetBtn", () => {

    resetWord();

});

bindButton("hintBtn", () => {

    play(clickSound);

    document.getElementById("message").textContent =
        "💡 " + currentQuestion.text;

});

    document.getElementById("nextGameBtn").style.display = "block";

    document.getElementById("nextGameBtn").onclick = () => {

        window.location.href =
        `../matching/?grade=${grade}&unit=${unit}`;

    };

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

    const totalWords = currentQuestion.text.split(" ");

    for (let i = 0; i < totalWords.length; i++) {

        const slot = document.createElement("button");

        slot.className = "slot";

        if (answer[i]) {

            slot.textContent = answer[i].text;

            slot.onclick = () => {

                play(clickSound);

                answer[i].used = false;

                answer.splice(i, 1);

                render();

            };

        }

        area.appendChild(slot);

    }

}

// --------------------
// Word Buttons
// --------------------

function renderWords() {

    const area = document.getElementById("words");

    area.innerHTML = "";

    shuffled.forEach(word => {

        if (word.used) return;

        const btn = document.createElement("button");

        btn.className = "word";

        btn.textContent = word.text;

        btn.onclick = () => {

            play(clickSound);

            word.used = true;

            answer.push(word);

            render();

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

    const studentAnswer = answer
    .map(word => word.text)
    .join(" ");

    if (
      studentAnswer  === currentQuestion.text
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

    shuffled.forEach(word => {
        word.used = false;
    });

    render();

};

document.getElementById("nextBtn").onclick = () => {

    nextQuestion();

};