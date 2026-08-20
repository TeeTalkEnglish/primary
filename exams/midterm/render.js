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
    if (question.grade && question.unit) {
        return `../../../assets/images/vocabulary/grade${question.grade}/unit${question.unit}/${question.image}`;
    }
    return `../../../assets/images/midterm/${question.image}`;
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
        `../../../assets/audio/grade${grade}/midterm/${question.audio}`;

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
        return `../../../assets/audio/grade${question.grade}/unit${question.unit}/${question.audio}`;
    }
    return `../../../assets/audio/midterm/${question.audio}`;
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