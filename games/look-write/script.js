const params = new URLSearchParams(window.location.search);

const grade = params.get("grade");
const unit = params.get("unit");

const clickSound =
new Audio("../../assets/sounds/click.mp3");

const successSound =
new Audio("../../assets/sounds/success.mp3");

const wrongSound =
new Audio("../../assets/sounds/wrong.mp3");

let words = [];
let currentIndex = 0;
let currentQuestion;

fetch(`../../assets/data/grade${grade}/unit${unit}.json`)
.then(res => res.json())
.then(data=>{

    words = shuffle(data.vocabulary);

    nextQuestion();

});


// --------------------
// Puzzle Generator
// --------------------

function makePuzzle(word){

   let puzzleData = [];

    return word.split(" ").map(singleWord=>{

        return singleWord
            .split("")
            .map((letter,index)=>{

                // Always keep first & last letter

                if(
                    index===0 ||
                    index===singleWord.length-1
                ){

                    puzzleData.push({
                        letter,
                        hidden:false
                    });

                    return {
                        type:"text",
                        value:letter
                    };

                }

                // Hide every other middle letter

                if(index%2===1){

                    puzzleData.push({
                        letter,
                        hidden:true
                    });

                    return {
                        type:"input",
                        answer:letter
                    };

                }

                puzzleData.push({
                    letter,
                    hidden:false
                });

                return{
                    type:"text",
                    value:letter
                };

            });

    });

}



function checkAnswer(){

    const inputs =
document.querySelectorAll(".underline-letter");

    let correct=true;

    inputs.forEach(input=>{

        if(
            input.value.toLowerCase() !==
            input.dataset.answer.toLowerCase()
        ){

            correct=false;

            input.classList.add("wrong");

        }

        else{

            input.classList.remove("wrong");

            input.classList.add("correct");

        }

    });

   if(correct){

    successSound.currentTime = 0;
play(successSound);

    document.getElementById("message").textContent =
    "🎉 Great Job!";

    document.getElementById("nextBtn").style.display =
    "inline-block";

}

    else{

        play(wrongSound);
    }

    console.log("Correct:", correct);

}

function nextQuestion(){

    if(currentIndex >= words.length){

        finishHomework();
        return;

    }

    currentQuestion = words[currentIndex];

    document.getElementById("nextBtn").style.display = "none";

    renderQuestion();

}


document
    .getElementById("checkBtn")
    .addEventListener("click", checkAnswer);

    document.getElementById("nextBtn").onclick = () => {

    currentIndex++;

    nextQuestion();

};

function play(sound){

    sound.currentTime = 0;
    sound.play();

}