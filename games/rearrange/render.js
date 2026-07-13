// ======================================
// TeeTalk Rearrange Letters
// render.js
// Draw everything on the screen
// ======================================

// --------------------
// Render Entire Game
// --------------------

function render() {

    renderImage();

    renderAnswer();

    renderLetters();

    updateProgress();

}

// --------------------
// Render Image
// --------------------

function renderImage() {

  

  document.getElementById("wordImage").src =
`../../assets/images/vocabulary/grade${game.grade}/unit${game.unit}/${game.currentWord.image}`;

}

// --------------------
// Render Answer
// --------------------

function renderAnswer() {

    const area = document.getElementById("answer");

    area.innerHTML = "";

    for (let i = 0; i < game.currentWord.word.length; i++) {

        const slot = document.createElement("button");

        slot.className = "slot";

        if (game.answer[i]) {

            slot.textContent = game.answer[i].letter;

            slot.onclick = () => {

                play(clickSound);

                // Put the letter back
                game.answer[i].used = false;

                // Remove from answer
                game.answer.splice(i, 1);

                render();

            };

        }

        area.appendChild(slot);

    }

}

// --------------------
// Render Letter Buttons
// --------------------

function renderLetters() {

    const area = document.getElementById("letters");

    area.innerHTML = "";

    game.letters.forEach(letter => {

        if (letter.used) return;

        const btn = document.createElement("button");

        btn.className = "letter";

        btn.textContent = letter.letter;

        btn.onclick = () => {

            play(clickSound);

            letter.used = true;

            game.answer.push(letter);

            render();

            checkAnswer();

        };

        area.appendChild(btn);

    });

}

// --------------------
// Progress Bar
// --------------------

function updateProgress() {

    if (game.words.length === 0) return;

    const percent =
        Math.round(
            (game.currentIndex / game.words.length) * 100
        );

    document.getElementById("progressFill").style.width =
        percent + "%";

    document.getElementById("progressText").textContent =
        `Homework Progress ${game.currentIndex}/${game.words.length} (${percent}%)`;

}