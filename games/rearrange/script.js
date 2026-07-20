// ======================================
// TeeTalk Rearrange Letters
// script.js
// ======================================

const game = {

    grade: null,

    unit: null,

    words: [],

    currentIndex: 0,

    currentWord: null,

    letters: [],

    answer: []

};

// --------------------
// Read URL
// --------------------

const params = new URLSearchParams(window.location.search);

game.grade = params.get("grade");
game.unit = params.get("unit");

// --------------------
// Back Button
// --------------------

document.getElementById("backBtn").href =
`../../grade${game.grade}/unit.html?unit=${game.unit}`;

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
        "💡 " + game.currentWord.word;

});

// --------------------
// Start Game
// --------------------

loadGame();