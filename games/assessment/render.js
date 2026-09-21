function getQuestionImagePath(question) {
	if (question.imagePath) return question.imagePath;
	const imageUnit = question.imageUnit ?? question.unit;
	if (imageUnit !== undefined && imageUnit !== null) {
		if (question.imageSource === "vocabulary") {
			return `../../assets/images/vocabulary/grade${question.grade || grade}/unit${imageUnit}/${question.image}`;
		}
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

function isPlaceholderReference(value) {
	if (typeof value !== "string") return false;
	return value.startsWith("PLACEHOLDER_") || /placeholder|missing/i.test(value);
}

function renderMediaPlaceholder(label, type = "image") {
	const placeholder = document.createElement("div");
	placeholder.className = "media-placeholder";
	placeholder.textContent = type === "audio" ? `🎧 ${label}` : `🖼 ${label}`;
	return placeholder;
}

function addImage(question, container) {
	if (!question.image) return;
	if (isPlaceholderReference(question.image)) {
		container.appendChild(renderMediaPlaceholder(question.imageAlt || "Image placeholder", "image"));
		return;
	}
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
	if (Array.isArray(question.audio)) {
		question.audio.forEach((audioValue, index) => {
			const wrapper = document.createElement("div");
			wrapper.className = "listening-player";
			const label = document.createElement("p");
			label.className = "audio-label";
			label.textContent = `Listen carefully ${index + 1}`;
			if (isPlaceholderReference(audioValue)) {
				wrapper.appendChild(label);
				wrapper.appendChild(renderMediaPlaceholder(`Audio ${index + 1} placeholder`, "audio"));
				container.appendChild(wrapper);
				return;
			}
			const audio = document.createElement("audio");
			audio.controls = true;
			audio.preload = "metadata";
			audio.src = question.unit ? getVocabularyAudioPath({ ...question, audio: audioValue }) : getExamAudioPath({ ...question, audio: audioValue });
			audio.onerror = () => {
				if (!question.unit && !question.audioPath) {
					audio.src = `../../assets/audio/grade${question.grade || grade}/${examType}/${audioValue}`;
				}
			};
			wrapper.append(label, audio);
			container.appendChild(wrapper);
		});
		return;
	}
	if (isPlaceholderReference(question.audio)) {
		const wrapper = document.createElement("div");
		wrapper.className = "listening-player";
		const label = document.createElement("p");
		label.className = "audio-label";
		label.textContent = "Listen carefully";
		wrapper.append(label, renderMediaPlaceholder("Audio placeholder", "audio"));
		container.appendChild(wrapper);
		return;
	}
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

function renderStressChoice(question, container) {
	const options = document.createElement("div");
	options.className = "options";
	(question.options || []).forEach((option, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "option stress-option";
		button.dataset.answerValue = index;
		button.textContent = typeof option === "string" ? option : option.label || "";
		button.addEventListener("click", () => {
			options.querySelectorAll(".option").forEach(item => item.classList.remove("selected"));
			button.classList.add("selected");
		});
		options.appendChild(button);
	});
	container.appendChild(options);
	window.questionControllers = window.questionControllers || {};
	window.questionControllers[question.type] = {
		getAnswer: () => document.querySelector(".stress-option.selected")?.dataset.answerValue ?? null,
		setAnswer: answer => {
			const selected = document.querySelector(`.stress-option[data-answer-value="${answer}"]`);
			options.querySelectorAll(".option").forEach(item => item.classList.remove("selected"));
			selected?.classList.add("selected");
		}
	};
}

function renderListenNumber(question, container) {
	addAudio(question, container);
	const list = document.createElement("div");
	list.className = "listen-number-list";
	const maxNumber = Math.max(1, Number(question.items?.length || question.maxNumber || 5));
	const answers = Array((question.items || []).length).fill(null);
	(question.items || []).forEach((item, index) => {
		const card = document.createElement("div");
		card.className = "listen-number-item";
		const imageWrap = document.createElement("div");
		imageWrap.className = "listen-number-image-wrap";
		if (item.image && !isPlaceholderReference(item.image)) {
			const image = document.createElement("img");
			image.className = "listen-number-image";
			image.src = item.imagePath || `../../assets/images/${item.image}`;
			image.alt = item.imageAlt || item.id || `Listening item ${index + 1}`;
			image.onerror = () => {
				image.replaceWith(renderMediaPlaceholder(item.imageAlt || `Image ${index + 1}`, "image"));
			};
			imageWrap.appendChild(image);
		} else {
			imageWrap.appendChild(renderMediaPlaceholder(item.imageAlt || `Image ${index + 1}`, "image"));
		}
		const controls = document.createElement("div");
		controls.className = "listen-number-controls";
		for (let number = 1; number <= maxNumber; number += 1) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "listen-number-button";
			button.dataset.value = String(number);
			button.textContent = number;
			button.addEventListener("click", () => {
				answers[index] = number;
				controls.querySelectorAll(".listen-number-button").forEach(itemButton => itemButton.classList.toggle("selected", Number(itemButton.dataset.value) === number));
			});
			controls.appendChild(button);
		}
		card.append(imageWrap, controls);
		list.appendChild(card);
	});
	container.appendChild(list);
	window.questionControllers = window.questionControllers || {};
	window.questionControllers[question.type] = {
		getAnswer: () => answers.slice(),
		setAnswer: savedAnswer => {
			const incoming = Array.isArray(savedAnswer) ? savedAnswer : [];
			const itemCards = list.querySelectorAll(".listen-number-item");
			itemCards.forEach((card, index) => {
				const value = incoming[index];
				const buttons = card.querySelectorAll(".listen-number-button");
				buttons.forEach(button => button.classList.toggle("selected", Number(button.dataset.value) === Number(value)));
				if (value !== undefined && value !== null && value !== "") {
					answers[index] = Number(value);
				} else {
					answers[index] = null;
				}
			});
		}
	};
}

function renderListenChoice(question, container) { addAudio(question, container); renderOptions(question, container); }
function renderLookWrite(question, container) { renderTextInput(question, container); }
function renderPictureChoice(question, container) { renderOptions(question, container, true); }
function renderChoice(question, container) { renderOptions(question, container); }
function renderFill(question, container) { renderTextInput(question, container); }
function renderSentence(question, container) { renderTextInput(question, container, true); }
function renderFillWordBank(question, container) {
	const passage = document.createElement("div");
	passage.className = "word-bank-passage";
	const text = document.createElement("p");
	text.className = "word-bank-text";
	const textValue = typeof question.text === "string" ? question.text : question.passage || "";
	const blanks = textValue.split(/___+/).length - 1;
	const items = [];
	let currentText = textValue;
	let blankIndex = 0;
	if (blanks > 0) {
		const parts = textValue.split(/___+/);
		currentText = parts.map((part, index) => {
			if (index === parts.length - 1) return part;
			const input = document.createElement("button");
			input.type = "button";
			input.className = "word-bank-input";
			input.textContent = "_____";
			input.dataset.index = String(blankIndex);
			items.push({ input, index: blankIndex });
			blankIndex += 1;
			return `${part} ${input.outerHTML}`;
		}).join("");
		text.innerHTML = currentText;
	} else {
		text.textContent = textValue;
	}
	passage.appendChild(text);
	container.appendChild(passage);
	const bank = document.createElement("div");
	bank.className = "word-bank";
	(question.wordBank || []).forEach((word, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "word-bank-item";
		button.textContent = word;
		button.dataset.word = word;
		button.addEventListener("click", () => {
			const currentIndex = Number(document.querySelector(".word-bank-input.selected")?.dataset?.index ?? -1);
			const target = document.querySelector(`.word-bank-input[data-index="${currentIndex >= 0 ? currentIndex : 0}"]`);
			if (!target) return;
			target.textContent = word;
			target.classList.add("filled");
			target.dataset.value = word;
			const activeInputs = document.querySelectorAll(".word-bank-input");
			activeInputs.forEach(input => input.classList.remove("selected"));
			button.classList.add("used");
		});
		bank.appendChild(button);
	});
	container.appendChild(bank);
	const blankInputs = [...container.querySelectorAll(".word-bank-input")];
	blankInputs.forEach(input => {
		input.addEventListener("click", () => {
			blankInputs.forEach(item => item.classList.toggle("selected", item === input));
		});
	});
	window.questionControllers = window.questionControllers || {};
	window.questionControllers[question.type] = {
		getAnswer: () => blankInputs.map(input => input.dataset.value || ""),
		setAnswer: savedAnswer => {
			const values = Array.isArray(savedAnswer) ? savedAnswer : [];
			blankInputs.forEach((input, index) => {
				const value = values[index] || "";
				input.textContent = value || "_____";
				input.dataset.value = value;
				input.classList.toggle("filled", Boolean(value));
			});
		}
	};
}

function renderLookComplete(question, container) {
	if (question.image) addImage(question, container);
	const prompt = document.createElement("p");
	prompt.className = "question-instruction";
	prompt.textContent = question.prompt || question.question || "Complete the sentence.";
	container.appendChild(prompt);
	const input = document.createElement("input");
	input.type = "text";
	input.id = "textAnswer";
	input.className = "fill-input";
	input.placeholder = question.placeholder || "Write your answer";
	if (question.maxWords) input.setAttribute("maxlength", String(question.maxWords * 20 + 10));
	container.appendChild(input);
	window.questionControllers = window.questionControllers || {};
	window.questionControllers[question.type] = {
		getAnswer: () => input.value || "",
		setAnswer: value => {
			input.value = value || "";
		}
	};
}

function renderReorder(question, container) {
	const choices = document.createElement("div");
	choices.className = "reorder-choices";
	const answerOrder = [];
	(question.words || []).forEach((word, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "reorder-word";
		button.dataset.word = word;
		button.textContent = word;
		button.addEventListener("click", () => {
			if (answerOrder.includes(word)) {
				answerOrder.splice(answerOrder.indexOf(word), 1);
				button.classList.remove("selected");
			} else {
				answerOrder.push(word);
				button.classList.add("selected");
			}
		});
		choices.appendChild(button);
	});
	const result = document.createElement("div");
	result.className = "reorder-result";
	result.textContent = "Your sentence: ";
	const sentence = document.createElement("span");
	sentence.className = "reorder-sentence";
	result.appendChild(sentence);
	container.append(choices, result);
	window.questionControllers = window.questionControllers || {};
	window.questionControllers[question.type] = {
		getAnswer: () => answerOrder.slice(),
		setAnswer: savedAnswer => {
			const values = Array.isArray(savedAnswer) ? savedAnswer : [];
			answerOrder.length = 0;
			choices.querySelectorAll(".reorder-word").forEach(button => {
				const selected = values.includes(button.dataset.word);
				button.classList.toggle("selected", selected);
				if (selected) answerOrder.push(button.dataset.word);
			});
			sentence.textContent = answerOrder.join(" ");
		}
	};
	const refreshResult = () => { sentence.textContent = answerOrder.join(" "); };
	const originalClick = choices.querySelectorAll(".reorder-word")[0]?.onclick;
	choices.querySelectorAll(".reorder-word").forEach(button => {
		button.addEventListener("click", refreshResult);
	});
}

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
		"stress-choice": renderStressChoice,
		"fill-word-bank": renderFillWordBank,
		"look-complete": renderLookComplete,
		"reorder": renderReorder,
		"look-write": renderLookWrite,
		"picture-choice": renderPictureChoice,
		choice: renderChoice,
		fill: renderFill,
		sentence: renderSentence,
		reading: renderReading,
		matching: renderMatching,
		unscramble: renderUnscrambleQuestion
	};
	window.questionControllers = {};
	(renderers[question.type] || renderFill)(question, card);
	container.appendChild(card);
}
