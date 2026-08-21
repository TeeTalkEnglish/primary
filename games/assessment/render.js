function getVocabularyImagePath(question) {
	if (question.imagePath) return question.imagePath;
	if (!question.unit) return `../../assets/images/${examType}/${question.image}`;
	return `../../assets/images/vocabulary/grade${question.grade || grade}/unit${question.unit}/${question.image}`;
}

function getVocabularyAudioPath(question) {
	if (question.audioPath) return question.audioPath;
	return `../../assets/audio/vocabulary/grade${question.grade || grade}/unit${question.unit}/${question.audio}`;
}

function getExamAudioPath(question) {
	if (question.audioPath) return question.audioPath;
	return `../../assets/audio/${examType}/grade${question.grade || grade}/${question.audio}`;
}

function addImage(question, container) {
	if (!question.image) return;
	const image = document.createElement("img");
	image.className = "question-image";
	image.src = getVocabularyImagePath(question);
	image.alt = question.imageAlt || question.word || "Question image";
	image.onerror = () => image.remove();
	container.appendChild(image);
}

function addAudio(question, container) {
	if (!question.audio) return;
	const wrapper = document.createElement("div");
	wrapper.className = "listening-player";
	const label = document.createElement("p");
	label.className = "audio-label";
	label.textContent = "Listen carefully";
	const audio = document.createElement("audio");
	audio.controls = true;
	audio.preload = "metadata";
	audio.src = question.unit ? getVocabularyAudioPath(question) : getExamAudioPath(question);
	audio.onerror = () => {
		if (!question.unit && !question.audioPath) {
			audio.src = `../../assets/audio/grade${question.grade || grade}/${examType}/${question.audio}`;
		}
	};
	wrapper.append(label, audio);
	container.appendChild(wrapper);
}

function renderOptions(question, container, imageOptions = false) {
	const options = document.createElement("div");
	options.className = imageOptions ? "options picture-options" : "options";
	(question.options || []).forEach((option, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "option";
		button.dataset.answerValue = index;
		if (imageOptions && option && typeof option === "object" && option.image) {
			const image = document.createElement("img");
			image.src = option.imagePath || `../../assets/images/vocabulary/grade${question.grade || grade}/unit${question.unit}/${option.image}`;
			image.alt = option.imageAlt || option.label || "Answer choice";
			image.onerror = () => image.remove();
			button.appendChild(image);
			if (option.label) button.append(option.label);
		} else {
			button.textContent = typeof option === "object" ? option.label || option.text || "" : option;
		}
		button.addEventListener("click", () => {
			options.querySelectorAll(".option").forEach(item => item.classList.remove("selected"));
			button.classList.add("selected");
		});
		options.appendChild(button);
	});
	container.appendChild(options);
}

function renderTextInput(question, container, multiline = false) {
	const input = document.createElement(multiline ? "textarea" : "input");
	input.id = "textAnswer";
	input.className = multiline ? "writing-input" : "fill-input";
	input.placeholder = question.placeholder || (multiline ? "Write your answer" : "Write your answer");
	if (multiline) input.rows = 4;
	container.appendChild(input);
}

function renderListenNumber(question, container) { addAudio(question, container); renderOptions(question, container); }
function renderListenChoice(question, container) { addAudio(question, container); renderOptions(question, container); }
function renderLookWrite(question, container) { addImage(question, container); renderTextInput(question, container); }
function renderPictureChoice(question, container) { addImage(question, container); renderOptions(question, container, true); }
function renderChoice(question, container) { addImage(question, container); renderOptions(question, container); }
function renderFill(question, container) { renderTextInput(question, container); }
function renderSentence(question, container) { renderTextInput(question, container, true); }
function renderReading(question, container) {
	renderPassage(question, container);
	renderOptions(question, container);
	if (!question.options) renderTextInput(question, container, true);
}

function renderPassage(question, container) {
	if (!question.passage) return;
	const passage = document.createElement("div");
	passage.className = "reading-passage";
	const title = document.createElement("h3");
	const text = document.createElement("p");
	title.textContent = typeof question.passage === "string" ? "Read the passage" : question.passage.title || "Read the passage";
	text.textContent = typeof question.passage === "string" ? question.passage : question.passage.text || "";
	passage.append(title, text);
	container.appendChild(passage);
}

function renderQuestion(question, questionNumber, totalQuestions) {
	const container = document.getElementById("questionContainer");
	container.innerHTML = "";
	const card = document.createElement("div");
	card.className = "question-card";
	const number = document.createElement("p");
	number.className = "question-number";
	number.textContent = `Question ${questionNumber} of ${totalQuestions}`;
	card.appendChild(number);
	if (question.question || question.text) {
		const prompt = document.createElement("h2");
		prompt.className = "question-text";
		prompt.textContent = question.question || question.text;
		card.appendChild(prompt);
	}
	const renderers = {
		"listen-number": renderListenNumber,
		"listen-choice": renderListenChoice,
		"look-write": renderLookWrite,
		"picture-choice": renderPictureChoice,
		choice: renderChoice,
		fill: renderFill,
		sentence: renderSentence,
		reading: renderReading
	};
	(renderers[question.type] || renderFill)(question, card);
	container.appendChild(card);
}
