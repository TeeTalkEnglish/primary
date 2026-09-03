// ============================================
// MIDTERM QUESTION RENDERER
// ============================================

function renderQuestion(question, questionNumber, totalQuestions) {
    const container = document.getElementById("questionContainer");
    if (!container) return;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "question-header";
    header.innerHTML = `<span class="question-number">Question ${questionNumber} of ${totalQuestions}</span>`;
    container.appendChild(header);

    const card = document.createElement("div");
    card.className = "question-card";
    container.appendChild(card);

    renderPassage(question, card);

    if (question.image) {
        const image = document.createElement("img");
        image.className = "question-image";
        image.src = getQuestionImagePath(question);
        image.alt = question.imageAlt || "Question image";
        image.onerror = () => image.remove();
        card.appendChild(image);
    }

    if (question.audio) renderAudio(question, card);

    if (question.question || question.text) {
        const questionText = document.createElement("h2");
        questionText.className = "question-text";
        questionText.textContent = question.question || question.text;
        card.appendChild(questionText);
    }

    if (question.type === "unscramble" && question.instruction) {
        const instruction = document.createElement("p");
        instruction.className = "question-instruction";
        instruction.textContent = question.instruction;
        card.appendChild(instruction);
    }

    switch (question.type) {
        case "choice":
        case "listen-choice":
            renderChoiceQuestion(question, card);
            break;
        case "fill":
            renderFillQuestion(question, card);
            break;
        case "sentence":
            renderSentenceQuestion(question, card);
            break;
        case "unscramble":
            renderUnscrambleQuestion(question, card);
            break;
        default:
            renderUnsupportedQuestion(question, card);
    }

    const message = document.createElement("div");
    message.id = "questionMessage";
    message.className = "question-message";
    card.appendChild(message);
}

function getQuestionImagePath(question) {
    if (question.imagePath) return question.imagePath;
    const imageUnit = question.imageUnit ?? question.unit;
    const imageGrade = question.grade || grade;
    if (imageGrade && imageUnit) {
        return `../../assets/images/vocabulary/grade${imageGrade}/unit${imageUnit}/${question.image}`;
    }
    return `../../assets/images/midterm/${question.image}`;
}

function renderAudio(question, container) {

    if (!question.audio) {
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "listening-player";

    const label = document.createElement("p");
    label.className = "audio-label";
    label.textContent = "🎧 Listen carefully";

    const audio = document.createElement("audio");

    audio.controls = true;
    audio.preload = "metadata";

    // If JSON contains only the filename:
    audio.src =
        `../../assets/audio/grade${grade}/midterm/${question.audio}`;

    audio.onerror = () => {

        console.error(
            "Audio failed to load:",
            audio.src
        );

    };

    wrapper.appendChild(label);
    wrapper.appendChild(audio);

    container.appendChild(wrapper);
}

function getQuestionAudioPath(question) {
    if (question.audioPath) return question.audioPath;
    if (question.grade && question.unit) {
        return `../../assets/audio/grade${question.grade}/unit${question.unit}/${question.audio}`;
    }
    return `../../assets/audio/midterm/${question.audio}`;
}

function renderChoiceQuestion(question, container) {
    const options = document.createElement("div");
    options.className = "answer-options";

    if (!Array.isArray(question.options)) return;

    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "answer-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "questionAnswer";
        input.value = index;
        const text = document.createElement("span");
        text.textContent = option;
        label.append(input, text);
        options.appendChild(label);
    });

    container.appendChild(options);
}

function renderFillQuestion(question, container) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "textAnswer";
    input.className = "text-answer";
    input.placeholder = question.placeholder || "Write your answer";
    container.appendChild(input);
}

function renderSentenceQuestion(question, container) {
    const textarea = document.createElement("textarea");
    textarea.id = "textAnswer";
    textarea.className = "sentence-input";
    textarea.rows = 3;
    textarea.placeholder = question.placeholder || "Write the sentence";
    container.appendChild(textarea);
}

function renderPassage(question, container) {
    if (!question.passage) return;

    const passage = document.createElement("div");
    passage.className = "reading-passage";
    const title = document.createElement("h3");
    const text = document.createElement("p");

    if (typeof question.passage === "string") {
        title.textContent = "Read the passage";
        text.textContent = question.passage;
    } else {
        title.textContent = question.passage.title || "Read the passage";
        text.textContent = question.passage.text || "";
    }

    passage.append(title, text);
    container.appendChild(passage);
}

function renderUnsupportedQuestion(question, container) {
    const message = document.createElement("p");
    message.className = "question-error";
    message.textContent = `Question type "${question.type}" is not supported yet.`;
    container.appendChild(message);
}

function renderUnscrambleQuestion(question, container) {
    const exercise = document.createElement("div");
    exercise.className = "unscramble-exercise";
    const answers = (question.items || []).map(() => []);

    const renderItem = itemIndex => {
        const item = question.items[itemIndex];
        const itemContainer = exercise.querySelectorAll(".unscramble-item")[itemIndex];
        const available = itemContainer.querySelector(".unscramble-letters");
        const answer = itemContainer.querySelector(".unscramble-answer");
        available.innerHTML = "";
        answer.innerHTML = "";

        item.letters.forEach((letter, letterIndex) => {
            if (answers[itemIndex].includes(letterIndex)) return;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "unscramble-letter";
            button.textContent = letter;
            button.addEventListener("click", () => {
                answers[itemIndex].push(letterIndex);
                renderItem(itemIndex);
            });
            available.appendChild(button);
        });

        answers[itemIndex].forEach(letterIndex => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "unscramble-letter selected";
            button.textContent = item.letters[letterIndex];
            button.addEventListener("click", () => {
                answers[itemIndex] = answers[itemIndex].filter(index => index !== letterIndex);
                renderItem(itemIndex);
            });
            answer.appendChild(button);
        });
    };

    (question.items || []).forEach((item, itemIndex) => {
        const itemContainer = document.createElement("section");
        itemContainer.className = "unscramble-item";
        const number = document.createElement("h3");
        number.textContent = `${item.number ?? itemIndex + 1}.`;
        if (item.image) {
            const image = document.createElement("img");
            image.className = "unscramble-image";
            image.src = getQuestionImagePath({
                ...item,
                grade: question.grade || grade,
                unit: item.imageUnit ?? item.unit
            });
            image.alt = item.imageAlt || item.answer || "Vocabulary item";
            image.onerror = () => {
                const fallbackPath = `../../assets/images/grade${question.grade || grade}/unit${item.imageUnit ?? item.unit}/${item.image}`;
                if (image.src.endsWith(fallbackPath)) {
                    console.warn("Unscramble image unavailable:", image.src);
                    image.remove();
                    return;
                }
                image.src = fallbackPath;
            };
            itemContainer.appendChild(image);
        }
        const available = document.createElement("div");
        available.className = "unscramble-letters";
        const label = document.createElement("p");
        label.className = "unscramble-answer-label";
        label.textContent = "Your answer:";
        const answer = document.createElement("div");
        answer.className = "unscramble-answer";
        itemContainer.append(number, available, label, answer);
        exercise.appendChild(itemContainer);
    });

    container.appendChild(exercise);
    (question.items || []).forEach((item, itemIndex) => renderItem(itemIndex));
    window.unscrambleController = {
        getAnswer: () => answers.map(item => [...item]),
        setAnswer: savedAnswers => {
            (savedAnswers || []).forEach((item, itemIndex) => {
                if (!Array.isArray(item) || !answers[itemIndex]) return;
                answers[itemIndex] = item.filter((letterIndex, position) =>
                    Number.isInteger(letterIndex) && letterIndex >= 0 &&
                    letterIndex < question.items[itemIndex].letters.length &&
                    item.indexOf(letterIndex) === position
                );
                renderItem(itemIndex);
            });
        }
    };
}