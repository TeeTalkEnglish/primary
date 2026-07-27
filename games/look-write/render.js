function renderPuzzle(){

    const area =
    document.getElementById("puzzle");

    area.innerHTML = "";

    const puzzle =
    makePuzzle(currentQuestion.word);

    puzzle.forEach(word=>{

        const row =
        document.createElement("div");

        row.className = "word-row";

        word.forEach(letter=>{

            if(letter.type==="text"){

                const span =
                document.createElement("span");

                span.className =
                "fixed-letter";

                span.textContent =
                letter.value;

                row.appendChild(span);

            }

            else{

                const input = document.createElement("input");

input.type = "text";
input.maxLength = 1;

input.className = "underline-letter";

input.dataset.answer = letter.answer;

                row.appendChild(input);

            }

        });

        area.appendChild(row);

    });

}

function renderQuestion(){

    // IMAGE

    document.getElementById("wordImage").src =
    `../../assets/images/vocabulary/grade${grade}/unit${unit}/${currentQuestion.image}`;

    // TITLE

    document.getElementById("questionTitle").textContent =
    "What is this?";

    renderPuzzle();

}