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

    const response = await fetch(
        `../../assets/data/grade${game.grade}/unit${game.unit}.json`
    );

    const data = await response.json();

    document.getElementById("unitTitle").textContent =
        data.title;

    game.words = shuffle(data.vocabulary);

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

    game.letters = shuffle(

        game.currentWord.word

            .split("")

            .map((letter, index) => ({

                id: index,

                letter,

                used: false

            }))

    );

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

    document.getElementById("emoji").textContent = "🏆";

    document.getElementById("wordImage").style.display =
        "none";

    document.getElementById("letters").innerHTML = "";

    document.getElementById("answer").innerHTML = "";

    document.getElementById("message").textContent =
        "🎉 Homework Complete!";

    document.getElementById("nextBtn").style.display =
        "none";

}