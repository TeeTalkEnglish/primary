function getQuestionImagePath(question) {
	if (question.imagePath) return question.imagePath;
	const imageUnit = question.imageUnit ?? question.unit;
	if (imageUnit !== undefined && imageUnit !== null) {
		return `../../assets/images/grade${question.grade || grade}/unit${imageUnit}/${question.image}`;
	}
	return `../../assets/images/${examType}/${question.image}`;
}

function getVocabularyImagePath(question) {
	return getQuestionImagePath(question);
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
	image.src = getQuestionImagePath(question);
	image.alt = question.imageAlt || question.word || "Question image";
	image.onerror = () => {
		console.error("Failed to load question image:", image.src);
		const fallback = document.createElement("p");
		fallback.className = "image-fallback";
		fallback.textContent = "The question image is unavailable.";
		image.replaceWith(fallback);
	};
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
			image.src = option.imagePath || `../../assets/images/grade${question.grade || grade}/unit${question.unit}/${option.image}`;
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
	addImage(question, container);
	const input = document.createElement(multiline ? "textarea" : "input");
	input.id = "textAnswer";
	input.className = multiline ? "writing-input" : "fill-input";
	input.placeholder = question.placeholder || (multiline ? "Write your answer" : "Write your answer");
	if (multiline) input.rows = 4;
	container.appendChild(input);
}

function renderListenNumber(question, container) { addAudio(question, container); renderOptions(question, container); }
function renderListenChoice(question, container) { addAudio(question, container); renderOptions(question, container); }
function renderLookWrite(question, container) { renderTextInput(question, container); }
function renderPictureChoice(question, container) { renderOptions(question, container, true); }
function renderChoice(question, container) { renderOptions(question, container); }
function renderFill(question, container) { renderTextInput(question, container); }
function renderSentence(question, container) { renderTextInput(question, container, true); }
function renderMatching(question, container) {
	const matchingContainer = document.createElement("div");
	matchingContainer.className = "matching-exercise";
	container.appendChild(matchingContainer);
	window.matchingController = MatchingGame.create(matchingContainer, {
		...question,
		grade: question.grade || grade,
		onChange: answer => { window.matchingAnswer = answer; }
	});
}
function renderUnscrambleQuestion(question, container) {
	const unscrambleContainer = document.createElement("div");
	unscrambleContainer.className = "unscramble-exercise";
	const itemAnswers = (question.items || []).map(() => []);

	const renderItem = itemIndex => {
		const item = question.items[itemIndex];
		const itemContainer = unscrambleContainer.querySelectorAll(".unscramble-item")[itemIndex];
		const available = itemContainer.querySelector(".unscramble-letters");
		const answer = itemContainer.querySelector(".unscramble-answer");
		available.innerHTML = "";
		answer.innerHTML = "";
		(item.letters || []).forEach((letter, letterIndex) => {
			if (itemAnswers[itemIndex].includes(letterIndex)) return;
			const button = document.createElement("button");
			button.type = "button";
			button.className = "unscramble-letter";
			button.textContent = letter;
			button.setAttribute("aria-label", `Use letter ${letter}`);
			button.addEventListener("click", () => {
				itemAnswers[itemIndex].push(letterIndex);
				renderItem(itemIndex);
			});
			available.appendChild(button);
		});
		itemAnswers[itemIndex].forEach(letterIndex => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "unscramble-letter selected";
			button.textContent = item.letters[letterIndex];
			button.setAttribute("aria-label", `Remove letter ${item.letters[letterIndex]}`);
			button.addEventListener("click", () => {
				itemAnswers[itemIndex] = itemAnswers[itemIndex].filter(index => index !== letterIndex);
				renderItem(itemIndex);
			});
			answer.appendChild(button);
		});
	};

	(question.items || []).forEach((item, itemIndex) => {
	const itemContainer = document.createElement("section");
	itemContainer.className = "unscramble-item";

	const itemNumber = document.createElement("h3");
	itemNumber.textContent = `${item.number ?? itemIndex + 1}.`;

	if (item.image) {
		const image = document.createElement("img");
		image.className = "unscramble-image";
		image.src = item.imagePath ||
			`../../assets/images/grade${item.grade || question.grade || grade}/unit${item.imageUnit ?? item.unit ?? question.imageUnit ?? question.unit}/${item.image}`;
		image.alt = item.imageAlt || item.answer || "Vocabulary picture";
		image.onerror = () => {
			console.error("Failed to load unscramble image:", image.src);
			image.remove();
		};
		itemContainer.appendChild(image);
	}

	const available = document.createElement("div");
	available.className = "unscramble-letters";

	const answerLabel = document.createElement("p");
	answerLabel.className = "unscramble-answer-label";
	answerLabel.textContent = "Your answer:";

	const answer = document.createElement("div");
	answer.className = "unscramble-answer";

	itemContainer.append(itemNumber, available, answerLabel, answer);
	unscrambleContainer.appendChild(itemContainer);
});

	container.appendChild(unscrambleContainer);
	(question.items || []).forEach((item, itemIndex) => renderItem(itemIndex));
	window.unscrambleController = {
		getAnswer: () => itemAnswers.map(itemAnswer => [...itemAnswer]),
		setAnswer: savedAnswers => {
			(savedAnswers || []).forEach((itemAnswer, itemIndex) => {
				if (!Array.isArray(itemAnswer) || !itemAnswers[itemIndex]) return;
				itemAnswers[itemIndex] = itemAnswer.filter((letterIndex, position) =>
					Number.isInteger(letterIndex) && letterIndex >= 0 && letterIndex < question.items[itemIndex].letters.length && itemAnswer.indexOf(letterIndex) === position
				);
				renderItem(itemIndex);
			});
		}
	};
}
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
	if (question.type === "unscramble") {
		const instruction = document.createElement("p");
		instruction.className = "question-instruction";
		instruction.textContent = question.instruction || "Put the letters in the correct order to make a word.";
		card.appendChild(instruction);
	}
	const renderers = {
		"listen-number": renderListenNumber,
		"listen-choice": renderListenChoice,
		"look-write": renderLookWrite,
		"picture-choice": renderPictureChoice,
		choice: renderChoice,
		fill: renderFill,
		sentence: renderSentence,
		reading: renderReading,
		matching: renderMatching,
		unscramble: renderUnscrambleQuestion
	};
	(renderers[question.type] || renderFill)(question, card);
	container.appendChild(card);
}
