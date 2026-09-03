// ======================================
// TeeTalk Rearrange Letters
// game.js
// ======================================

// --------------------
// Shuffle
// --------------------

function shuffle(array) {

    return [...array].sort(() => Math.random() - 0.5);

}

// --------------------
// Load JSON
// --------------------

async function loadGame() {
const url = game.mode === "unscramble"
    ? `../../assets/data/grade${game.grade}/unscramble.json`
    : `../../assets/data/grade${game.grade}/unit${game.unit}.json`;

console.log(url);

const response = await fetch(url);

const data = await response.json();

console.log(data);

    document.getElementById("gameTitle").textContent =
        data.title || "Rearrange Letters";
    document.getElementById("unitTitle").textContent =
        data.instruction || data.title;

        console.log(data);
console.log(data.vocabulary);

    game.words = game.mode === "unscramble"
        ? data.items.map(item => ({
            ...item,
            word: item.answer,
            mixedLetters: item.letters
        }))
        : shuffle(data.vocabulary);

    game.score = 0;

    loadWord();

}

// --------------------
// Load One Word
// --------------------

function loadWord() {

    if (game.currentIndex >= game.words.length) {

        finishHomework();

        return;

    }

    game.currentWord =
        game.words[game.currentIndex];

    game.answer = [];

    const sourceLetters = game.currentWord.mixedLetters || game.currentWord.word.split("");
    game.letters = shuffle(sourceLetters.map((letter, index) => ({

                id: index,

                letter,

                used: false

                })));

    render();

}

// --------------------
// Check Answer
// --------------------

function checkAnswer() {

    if (
        game.answer.length <
        game.currentWord.word.length
    )
        return;

    const answer =

        game.answer

            .map(letter => letter.letter)

            .join("");

    if (

        answer.toLowerCase()

        ===

        game.currentWord.word.toLowerCase()

    ) {

        play(successSound);

        document.getElementById("message").textContent =
            "🎉 Excellent!";

        game.score++;

        document.getElementById("nextBtn").style.display =
            "block";

    }

    else {

        play(wrongSound);

        document.getElementById("message").textContent =
            "❌ Try Again";

    }

}

// --------------------
// Next Word
// --------------------

function nextWord() {

    game.currentIndex++;

    loadWord();

}

// --------------------
// Reset
// --------------------

function resetWord() {

    game.answer = [];

    game.letters.forEach(letter => {

        letter.used = false;

    });

    document.getElementById("message").textContent = "";

    document.getElementById("nextBtn").style.display = "none";

    render();

}

// --------------------
// Hint
// --------------------

function hintWord() {

    if (game.answer.length > 0)
        return;

    game.letters[0].used = true;

    game.answer.push(game.letters[0]);

    render();

}

// --------------------
// Finish
// --------------------

function finishHomework() {

    const emoji = document.getElementById("emoji");
    if (emoji) emoji.textContent = "🏆";

    document.getElementById("wordImage").style.display =
        "none";

    document.getElementById("letters").innerHTML = "";

    document.getElementById("answer").innerHTML = "";

    document.getElementById("message").textContent =
        `🎉 Homework Complete! Score: ${game.score}/${game.words.length}`;

    document.getElementById("progressFill").style.width = "100%";
    document.getElementById("progressText").textContent =
        `Homework Progress ${game.words.length}/${game.words.length} (100%)`;

    document.getElementById("nextBtn").style.display =
        "none";

}