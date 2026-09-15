const params = new URLSearchParams(window.location.search);

const grade = params.get("grade") || "1";
const examType = params.get("period") || params.get("type") || "first-term";
const testId = params.get("test") || "1";

let examPath = params.get("data") || "";
const attemptKey = `primary-assessment-attempt:v2:grade${grade}:${examType}:${testId}:${examPath || "catalog"}`;

console.log("Loading exam:", examPath);

let examData = {};
let assessmentConfig = null;
let bankStats = {};
let questions = [];
let currentIndex = 0;
let answers = [];
let score = 0;
let reviewData = [];
let reviewFilter = "all";
let reviewMode = false;

const startScreen = document.getElementById("startScreen");
const examScreen = document.getElementById("examScreen");
const resultsScreen = document.getElementById("resultsScreen");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const previousBtn = document.getElementById("previousBtn");
const submitBtn = document.getElementById("submitBtn");
const retryBtn = document.getElementById("retryBtn");
const backToResultsBtn = document.getElementById("backToResultsBtn");
const loadStatus = document.getElementById("examLoadStatus");

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function shuffleArray(items) {
	const shuffled = [...items];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}
	return shuffled;
}

function questionIdentity(question) {
	return String(question.id ?? `${question.unit || "assessment"}:${question.section || ""}:${question.question || question.text || ""}`);
}

function shouldShuffleOptions(question) {
	return question.shuffleOptions !== false &&
		["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type) &&
		Array.isArray(question.options) &&
		Number.isInteger(Number(question.answer));
}

function shuffleAnswerChoices(question) {
	if (!shouldShuffleOptions(question)) return clone(question);
	const originalAnswer = Number(question.answer);
	const options = question.options.map((option, index) => ({
		option,
		correct: index === originalAnswer
	}));
	const shuffledOptions = shuffleArray(options);
	return {
		...clone(question),
		options: shuffledOptions.map(item => item.option),
		answer: shuffledOptions.findIndex(item => item.correct)
	};
}

function selectUniqueQuestions(bank, count, label) {
	if (bank.length < count) {
		throw new Error(`${label} needs ${count} questions, but only ${bank.length} are available.`);
	}
	const seen = new Set();
	const unique = [];
	shuffleArray(bank).forEach(question => {
		const id = questionIdentity(question);
		if (seen.has(id)) return;
		seen.add(id);
		unique.push(question);
	});
	if (unique.length < count) {
		throw new Error(`${label} needs ${count} unique questions, but only ${unique.length} unique questions are available.`);
	}
	return unique.slice(0, count).map(shuffleAnswerChoices);
}

function flattenQuestions(data) {
	if (Array.isArray(data.questions)) return data.questions;
	if (!Array.isArray(data.sections)) {
		return [];
	}

	const selectedQuestions = [];

	data.sections.forEach(section => {
		const bank = (section.questions || []).map(question => ({
			...question,
			section: question.section || section.id,
			passage: question.passage || section.passage
		}));

		const questionCount = Number(section.questionCount || bank.length);

		const selected = selectUniqueQuestions(bank, questionCount, section.title || section.id || "Assessment section");

		selectedQuestions.push(...selected);
	});

	return selectedQuestions;
}

function slugify(value) {
	return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function maskWord(word) {
	const characters = String(word).split("");
	let revealed = 0;
	return characters.map((character, index) => {
		if (!/[a-z]/i.test(character)) return character;
		if (index === 0 || index === characters.length - 1 || revealed >= 2) return character;
		revealed += 1;
		return "_";
	}).join("");
}

function findSentenceUsing(unit, word) {
	const normalized = String(word).toLowerCase();
	return (unit.sentences || []).find(sentence => String(sentence.text || "").toLowerCase().includes(normalized));
}

function choiceOptions(correct, pool, size = 4) {
	const normalizedCorrect = String(correct).toLowerCase();
	const distractors = shuffleArray(pool.filter(item => String(item).toLowerCase() !== normalizedCorrect));
	return [correct, ...distractors.slice(0, size - 1)];
}

function vocabularyImagePath(unit, item) {
	return `../../assets/images/vocabulary/grade${grade}/unit${unit.id}/${item.image || `${slugify(item.word)}.png`}`;
}

function buildUnitQuestionBank(unit, config = {}) {
	const vocabulary = unit.vocabulary || [];
	const words = vocabulary.map(item => item.word).filter(Boolean);
	const meanings = vocabulary.map(item => item.meaning).filter(Boolean);
	const imageUnits = config.imageUnits || [];
	const imageExclusions = new Set(config.imageExclusions || []);
	const allowImages = imageUnits.includes(unit.id);
	const bank = [];

	vocabulary.forEach((item, index) => {
		const baseId = `g${grade}-u${unit.id}-v${item.id || index + 1}`;
		const word = item.word;
		if (!word) return;
		const sentence = findSentenceUsing(unit, word);

		if (item.meaning && words.length >= 3) {
			bank.push({
				id: `${baseId}-meaning-word`,
				grade: Number(grade),
				unit: unit.id,
				section: `unit-${unit.id}`,
				type: "choice",
				points: 1,
				question: `Which word matches this meaning: ${item.meaning}?`,
				options: choiceOptions(word, words),
				answer: 0
			});
		}

		if (item.meaning && meanings.length >= 3) {
			bank.push({
				id: `${baseId}-word-meaning`,
				grade: Number(grade),
				unit: unit.id,
				section: `unit-${unit.id}`,
				type: "choice",
				points: 1,
				question: `What does "${word}" mean?`,
				options: choiceOptions(item.meaning, meanings),
				answer: 0
			});
		}

		bank.push({
			id: `${baseId}-spelling`,
			grade: Number(grade),
			unit: unit.id,
			section: `unit-${unit.id}`,
			type: "fill",
			points: 1,
			question: `Complete the vocabulary word: ${maskWord(word)}`,
			answer: word
		});

		if (sentence && words.length >= 3) {
			bank.push({
				id: `${baseId}-sentence-choice`,
				grade: Number(grade),
				unit: unit.id,
				section: `unit-${unit.id}`,
				type: "choice",
				points: 1,
				question: `Choose the word that completes the sentence: ${sentence.text.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "______")}`,
				options: choiceOptions(word, words),
				answer: 0
			});
			bank.push({
				id: `${baseId}-sentence-fill`,
				grade: Number(grade),
				unit: unit.id,
				section: `unit-${unit.id}`,
				type: "fill",
				points: 1,
				question: `Complete the sentence: ${sentence.text.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "______")}`,
				answer: word
			});
		}

		if (allowImages && item.image && !imageExclusions.has(`${unit.id}/${item.image}`) && words.length >= 3) {
			bank.push({
				id: `${baseId}-picture`,
				grade: Number(grade),
				unit: unit.id,
				section: `unit-${unit.id}`,
				type: "choice",
				points: 1,
				question: "Choose the correct word.",
				image: item.image,
				imagePath: vocabularyImagePath(unit, item),
				imageSource: "vocabulary",
				imageAlt: word,
				options: choiceOptions(word, words),
				answer: 0
			});
		}
	});

	(unit.sentences || []).forEach((sentence, index) => {
		if (!sentence.text) return;
		const wordsInSentence = words.filter(word => sentence.text.toLowerCase().includes(String(word).toLowerCase()));
		if (!wordsInSentence.length || words.length < 3) return;
		const answer = wordsInSentence[0];
		bank.push({
			id: `g${grade}-u${unit.id}-s${sentence.id || index + 1}-keyword`,
			grade: Number(grade),
			unit: unit.id,
			section: `unit-${unit.id}`,
			type: "choice",
			points: 1,
			question: `Which Unit ${unit.id} word appears in this sentence? "${sentence.text}"`,
			options: choiceOptions(answer, words),
			answer: 0
		});
	});

	return bank;
}

async function loadUnit(unitId) {
	const response = await fetch(`../../assets/data/grade${grade}/unit${unitId}.json`);
	if (!response.ok) throw new Error(`Unable to load Unit ${unitId} question bank (HTTP ${response.status}).`);
	return response.json();
}

async function generateQuestionsFromConfig(data) {
	const selection = data.selection || {};
	const unitSelections = selection.units || (data.units || []).map(unit => ({
		unit,
		count: selection.questionsPerUnit || data.questionsPerUnit || 10
	}));
	if (!unitSelections.length) return flattenQuestions(data);

	const loadedUnits = await Promise.all(unitSelections.map(item => loadUnit(item.unit)));
	const questionsByUnit = new Map();
	bankStats = {};

	loadedUnits.forEach(unit => {
		const bank = buildUnitQuestionBank(unit, data.questionBank || {});
		questionsByUnit.set(unit.id, bank);
		bankStats[unit.id] = bank.length;
	});

	const selected = [];
	unitSelections.forEach(item => {
		const unitBank = questionsByUnit.get(item.unit) || [];
		selected.push(...selectUniqueQuestions(unitBank, Number(item.count), `Unit ${item.unit}`));
	});

	const shuffled = shuffleArray(selected);
	const expectedTotal = unitSelections.reduce((total, item) => total + Number(item.count), 0);
	if (shuffled.length !== expectedTotal) {
		throw new Error(`Generated ${shuffled.length} questions, expected ${expectedTotal}.`);
	}
	return shuffled;
}

function isGeneratedAssessment(data) {
	return Boolean(data.selection?.units || data.questionBank?.source);
}

function loadSavedAttempt() {
	try {
		const saved = JSON.parse(localStorage.getItem(attemptKey) || "null");
		if (!saved || saved.status !== "active" || !Array.isArray(saved.questions)) return null;
		if (saved.examPath !== examPath) return null;
		return saved;
	} catch (error) {
		console.warn("Unable to read saved attempt:", error);
		return null;
	}
}

function saveAttemptState(started = !startScreen.hidden) {
	if (!questions.length) return;
	try {
		localStorage.setItem(attemptKey, JSON.stringify({
			status: "active",
			examPath,
			started,
			currentIndex,
			questions,
			answers,
			savedAt: new Date().toISOString()
		}));
	} catch (error) {
		console.warn("Unable to save assessment attempt:", error);
	}
}

function clearSavedAttempt() {
	localStorage.removeItem(attemptKey);
}

async function createNewQuestionSet() {
	questions = isGeneratedAssessment(examData)
		? await generateQuestionsFromConfig(examData)
		: flattenQuestions(examData).map(shuffleAnswerChoices);
	if (!questions.length) throw new Error("The exam file contains no questions.");
	answers = [];
	currentIndex = 0;
	reviewData = [];
	reviewFilter = "all";
	reviewMode = false;
	saveAttemptState(false);
}

function sectionTitle(question) {
	const section = (examData.sections || []).find(item => item.id === question.section);
	return section?.title || question.section || "Assessment";
}

function hasAnswer(answer) {
	if (Array.isArray(answer)) return answer.some(value => value !== null && value !== undefined && value !== "");
	return answer !== null && answer !== undefined && String(answer).trim() !== "";
}

function getQuestionStatus(index) {
	if (reviewMode || reviewData.length) {
		const review = reviewData[index];
		if (!review) return "unanswered";
		return review.correct ? "correct" : review.studentAnswer === "Not answered" ? "unanswered" : "incorrect";
	}
	return hasAnswer(answers[index]) ? "answered" : "unanswered";
}

function renderQuestionNavigator(containerId, filter = "all") {
	const container = document.getElementById(containerId);
	if (!container) return;
	container.innerHTML = "";
	const groups = new Map();
	questions.forEach((question, index) => {
		const status = getQuestionStatus(index);
		if (filter === "incorrect" && status === "correct") return;
		if (filter === "correct" && status !== "correct") return;
		const key = question.section || "assessment";
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push({ index, status, question });
	});
	groups.forEach((items, key) => {
		const section = document.createElement("div");
		section.className = "question-nav-section";
		const title = document.createElement("h3");
		title.className = "question-nav-title";
		title.textContent = sectionTitle(items[0].question) || key;
		const buttons = document.createElement("div");
		buttons.className = "question-nav-buttons";
		items.forEach(({ index, status }) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = `question-number ${status} ${index === currentIndex ? "current" : ""}`;
			button.textContent = reviewMode ? `${index + 1} ${status === "correct" ? "✓" : status === "incorrect" ? "✗" : "—"}` : String(index + 1);
			button.setAttribute("aria-label", `Question ${index + 1}, ${status}`);
			button.setAttribute("aria-current", index === currentIndex ? "true" : "false");
			button.addEventListener("click", () => containerId === "reviewNavigator" ? enterReviewMode(index) : goToQuestion(index));
			buttons.appendChild(button);
		});
		section.append(title, buttons);
		container.appendChild(section);
	});
}

function updateQuestionNavigator() {
	renderQuestionNavigator("questionNavigator", reviewMode ? reviewFilter : "all");
	renderQuestionNavigator("reviewNavigator", reviewFilter);
}

function setupExamInfo() {
	const title = examData.title || `Grade ${grade} ${examType} Exam`;
	document.title = title;
	document.getElementById("examTitle").textContent = title;
	document.getElementById("examSubtitle").textContent = examData.subtitle || "";
	document.getElementById("startTitle").textContent = title;
	document.getElementById("introText").textContent = examData.intro || "Show what you have learned.";
	const totalPoints = questions.reduce((total, question) => total + Number(question.points || 1), 0);
	document.getElementById("totalPoints").textContent = `${totalPoints} points`;
	document.querySelector(".score-total").textContent = `/ ${totalPoints}`;
	const unitConfig = examData.selection?.units || [];
	document.getElementById("examInfo").innerHTML = unitConfig.length ? unitConfig.map(item => `
		<div class="info-item"><strong>Unit ${item.unit}</strong><small>${item.count} of ${bankStats[item.unit] || 0} bank questions</small></div>
	`).join("") : (examData.sections || []).map(section => `
		<div class="info-item"><strong>${section.title || section.id}</strong><small>${section.points || 0} points</small></div>
	`).join("");
	const gradeLink = `../../grade${grade}/index.html`;
	document.getElementById("backBtn").href = gradeLink;
	document.getElementById("backBtn").textContent = `Back to Grade ${grade}`;
	document.getElementById("homeBtn").href = gradeLink;
	document.getElementById("homeBtn").textContent = "Back to Grade";
}

async function loadExam() {
	loadStatus.textContent = `Loading ${examType} assessment...`;
	try {
		if (!examPath) {
			const catalogResponse = await fetch(`../../assets/data/grade${grade}/assessments.json`);
			if (catalogResponse.ok) {
				const catalog = await catalogResponse.json();
				const period = catalog.periods.find(item => item.id === examType);
				const test = period?.tests?.find(item => item.id === testId || item.id === `test-${String(testId).padStart(2, "0")}`);
				if (test?.data) examPath = `../../assets/data/grade${grade}/${test.data}`;
				else if (period?.data) examPath = `../../assets/data/grade${grade}/${period.data}`;
			}
		}
		if (!examPath && examType === "first-term") examPath = `../../assets/data/grade${grade}/first-term/test-${String(testId).padStart(2, "0")}.json`;
		if (!examPath) examPath = `../../assets/data/grade${grade}/${examType}.json`;
		const response = await fetch(examPath);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		examData = await response.json();
		assessmentConfig = examData;
		const savedAttempt = loadSavedAttempt();
		if (savedAttempt) {
			questions = savedAttempt.questions;
			answers = savedAttempt.answers || [];
			currentIndex = savedAttempt.currentIndex || 0;
			if (isGeneratedAssessment(examData)) {
				await generateQuestionsFromConfig(examData);
				questions = savedAttempt.questions;
			}
		} else {
			await createNewQuestionSet();
		}
		setupExamInfo();
		startBtn.disabled = false;
		loadStatus.textContent = savedAttempt ? `${questions.length} questions restored from this attempt.` : `${questions.length} randomized questions ready.`;
		if (savedAttempt?.started) {
			startScreen.hidden = true;
			resultsScreen.hidden = true;
			examScreen.hidden = false;
			showQuestion();
		}
	} catch (error) {
		loadStatus.textContent = `Unable to load ${examPath}: ${error.message}`;
		loadStatus.className = "exam-load-status exam-load-error";
	}
}

function startExam() {
	currentIndex = 0;
	answers = answers || [];
	score = 0;
	reviewData = [];
	reviewFilter = "all";
	reviewMode = false;
	startScreen.hidden = true;
	resultsScreen.hidden = true;
	examScreen.hidden = false;
	saveAttemptState(true);
	showQuestion();
}

function showQuestion() {
	const question = questions[currentIndex];
	window.matchingController = null;
	window.matchingAnswer = null;
	window.unscrambleController = null;
	renderQuestion(question, currentIndex + 1, questions.length);
	if (question.image && !document.querySelector("#questionContainer .question-image, #questionContainer .image-fallback")) {
		addImage(question, document.querySelector("#questionContainer .question-card"));
	}
	restoreAnswer(question);
	if (reviewMode) {
		document.querySelectorAll("#questionContainer input, #questionContainer textarea, #questionContainer button").forEach(control => {
			control.disabled = true;
		});
		appendReviewDetails();
	}
	document.getElementById("sectionTitle").textContent = sectionTitle(question);
	updateProgress();
	previousBtn.hidden = reviewMode || currentIndex === 0;
	nextBtn.hidden = reviewMode || currentIndex === questions.length - 1;
	submitBtn.hidden = reviewMode || currentIndex !== questions.length - 1;
	backToResultsBtn.hidden = !reviewMode;
	updateQuestionNavigator();
}

function restoreAnswer(question) {
	const answer = answers[currentIndex];
	if (answer === undefined || answer === null) return;
	if (question.type === "matching") {
		window.matchingController?.setAnswer(answer);
		return;
	}
	if (question.type === "unscramble") {
		window.unscrambleController?.setAnswer(answer);
		return;
	}
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type) && typeof answer !== "string") {
		return;
	}
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		const option = document.querySelector(`.option[data-answer-value="${answer}"]`);
		option?.classList.add("selected");
	} else {
		document.getElementById("textAnswer").value = answer;
	}
}

function getCurrentAnswer(question) {
	if (question.type === "matching") return window.matchingController?.getAnswer() || [];
	if (question.type === "unscramble") return window.unscrambleController?.getAnswer() || [];
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return document.querySelector(".option.selected")?.dataset.answerValue ?? null;
	}
	return document.getElementById("textAnswer")?.value || "";
}

function saveCurrentAnswer() {
	if (reviewMode) return;
	answers[currentIndex] = getCurrentAnswer(questions[currentIndex]);
	saveAttemptState(true);
}

function goToQuestion(index) {
	if (index < 0 || index >= questions.length) return;
	if (!reviewMode) saveCurrentAnswer();
	currentIndex = index;
	saveAttemptState(true);
	showQuestion();
}

function normalize(value) {
	return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(question, answer) {
	if (answer === null || answer === undefined) return false;
	if (question.type === "matching") {
		return Array.isArray(answer) && Array.isArray(question.items) && answer.length === question.items.length &&
			question.items.every((item, index) => normalize(answer[index]) === normalize(item.answer));
	}
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return Number(answer) === Number(question.answer);
	}
	if (Array.isArray(question.answer)) return question.answer.some(item => normalize(item) === normalize(answer));
	return normalize(answer) === normalize(question.answer);
}

function pointsForQuestion(question) {
	return Number(question.points || 1);
}

function answerText(question, answer) {
	if (answer === null || answer === undefined || answer === "") return "Not answered";
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return question.options?.[Number(answer)] ?? String(answer);
	}
	if (Array.isArray(answer)) return answer.length ? answer.join(", ") : "Not answered";
	return String(answer);
}

function createReviewData() {
	return questions.map((question, index) => {
		const studentAnswer = answers[index];
		const pointsAvailable = pointsForQuestion(question);
		if (question.type === "matching") {
			const itemPoints = question.items?.length ? pointsAvailable / question.items.length : 0;
			const items = (question.items || []).map((item, itemIndex) => {
				const itemAnswer = Array.isArray(studentAnswer) ? studentAnswer[itemIndex] : null;
				const correct = normalize(itemAnswer) === normalize(item.answer);
				return {
					image: item.imagePath || `../../assets/images/grade${question.grade || grade}/unit${item.unit || question.unit}/${item.image}`,
					imageAlt: item.imageAlt || item.answer,
					studentAnswer: answerText(question, itemAnswer),
					correctAnswer: item.answer,
					correct,
					pointsEarned: correct ? itemPoints : 0,
					pointsAvailable: itemPoints
				};
			});
			return {
				questionNumber: index + 1,
				section: sectionTitle(question),
				type: question.type,
				question: question.question || question.text || "",
				studentAnswer: studentAnswer || [],
				correctAnswer: question.items?.map(item => item.answer) || [],
				correct: items.length > 0 && items.every(item => item.correct),
				pointsEarned: items.reduce((total, item) => total + item.pointsEarned, 0),
				pointsAvailable,
				items
			};
		}
		if (question.type === "unscramble") {
			const itemPoints = question.items?.length ? pointsAvailable / question.items.length : 0;
			const items = (question.items || []).map((item, itemIndex) => {
				const selected = Array.isArray(studentAnswer?.[itemIndex]) ? studentAnswer[itemIndex] : [];
				const itemAnswer = selected.map(letterIndex => item.letters?.[letterIndex] ?? "").join("");
				const correct = normalize(itemAnswer) === normalize(item.answer);
				return {
					number: item.number ?? itemIndex + 1,
					studentAnswer: itemAnswer || "Not answered",
					correctAnswer: item.answer,
					correct,
					pointsEarned: correct ? itemPoints : 0,
					pointsAvailable: itemPoints
				};
			});
			return {
				questionNumber: index + 1,
				section: sectionTitle(question),
				type: question.type,
				question: question.exercise || question.question || question.text || "",
				studentAnswer: items.map(item => item.studentAnswer).join(", "),
				correctAnswer: items.map(item => item.correctAnswer).join(", "),
				correct: items.length > 0 && items.every(item => item.correct),
				pointsEarned: items.reduce((total, item) => total + item.pointsEarned, 0),
				pointsAvailable,
				items
			};
		}
		const correct = isCorrect(question, studentAnswer);
		return {
			questionNumber: index + 1,
			section: sectionTitle(question),
			type: question.type,
			question: question.question || question.text || "",
			image: question.image ? getVocabularyImagePath(question) : "",
			imageAlt: question.imageAlt || question.word || "Question image",
			audio: question.audio ? (question.audioPath || (question.unit ? getVocabularyAudioPath(question) : getExamAudioPath(question))) : "",
			studentAnswer: answerText(question, studentAnswer),
			correctAnswer: answerText(question, question.answer),
			correct,
			pointsEarned: correct ? pointsAvailable : 0,
			pointsAvailable
		};
	});
}

function calculateScore() {
	reviewData = createReviewData();
	score = reviewData.reduce((total, review) => total + review.pointsEarned, 0);
}

function updateProgress() {
	const percent = Math.round(((currentIndex + 1) / questions.length) * 100);
	document.getElementById("progressFill").style.width = `${percent}%`;
	document.getElementById("progressText").textContent = `${percent}%`;
	document.getElementById("questionProgress").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
}

function finishExam() {
	reviewMode = false;
	calculateScore();
	clearSavedAttempt();
	examScreen.hidden = true;
	resultsScreen.hidden = false;
	const totalPoints = reviewData.reduce((total, review) => total + review.pointsAvailable, 0);
	const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
	document.getElementById("score").textContent = score;
	document.getElementById("percentage").textContent = `${percentage}%`;
	document.getElementById("resultMessage").textContent = percentage >= 80 ? "Great work!" : "Keep practicing!";
	const sectionResults = {};
	reviewData.forEach(review => {
		const key = review.section || "Assessment";
		sectionResults[key] ||= { score: 0, total: 0 };
		sectionResults[key].total += review.pointsAvailable;
		sectionResults[key].score += review.pointsEarned;
	});
	document.getElementById("sectionResults").innerHTML = Object.entries(sectionResults).map(([key, result]) =>
		`<div class="section-result"><span>${key}</span><strong>${result.score} / ${result.total}</strong></div>`
	).join("");
	updateQuestionNavigator();
	renderReview();
}

function appendReviewDetails() {
	const review = reviewData[currentIndex];
	const card = document.querySelector("#questionContainer .question-card");
	if (!review || !card) return;
	const details = document.createElement("div");
	details.className = `review-details ${review.correct ? "review-correct" : "review-incorrect"}`;
	if (review.type === "unscramble") review.items.forEach(item => details.appendChild(renderUnscrambleReviewItem(item)));
	else appendAnswerComparison(details, review.studentAnswer, review.correctAnswer);
	const result = document.createElement("p");
	result.className = "review-result";
	result.textContent = `${review.correct ? "✓ Correct" : review.studentAnswer === "Not answered" ? "— Unanswered" : "✗ Incorrect"}  ${review.pointsEarned} / ${review.pointsAvailable} points`;
	details.appendChild(result);
	card.appendChild(details);
}

function renderUnscrambleReviewItem(item) {
	const wrapper = document.createElement("div");
	wrapper.className = `unscramble-review-item ${item.correct ? "review-correct" : "review-incorrect"}`;
	const heading = document.createElement("h5");
	heading.textContent = `${item.number}. ${item.correctAnswer} ${item.correct ? "✓" : "✗"}`;
	const answer = document.createElement("p");
	answer.textContent = `Your answer: ${item.studentAnswer}`;
	wrapper.append(heading, answer);
	if (!item.correct) {
		const expected = document.createElement("p");
		expected.textContent = `Correct answer: ${item.correctAnswer}`;
		wrapper.appendChild(expected);
	}
	return wrapper;
}

function enterReviewMode(index) {
	reviewMode = true;
	currentIndex = index;
	startScreen.hidden = true;
	resultsScreen.hidden = true;
	examScreen.hidden = false;
	showQuestion();
}

function appendReviewMedia(container, review) {
	if (review.image) {
		const image = document.createElement("img");
		image.className = "review-image";
		image.src = review.image;
		image.alt = review.imageAlt;
		image.onerror = () => image.remove();
		container.appendChild(image);
	}
	if (review.audio) {
		const audio = document.createElement("audio");
		audio.className = "review-audio";
		audio.controls = true;
		audio.preload = "metadata";
		audio.src = review.audio;
		container.appendChild(audio);
	}
}

function appendAnswerComparison(container, studentAnswer, correctAnswer) {
	const comparison = document.createElement("div");
	comparison.className = "answer-comparison";
	const yourAnswer = document.createElement("p");
	const expectedAnswer = document.createElement("p");
	yourAnswer.innerHTML = "<strong>Your answer:</strong> ";
	yourAnswer.append(document.createTextNode(studentAnswer));
	expectedAnswer.innerHTML = "<strong>Correct answer:</strong> ";
	expectedAnswer.append(document.createTextNode(correctAnswer));
	comparison.append(yourAnswer, expectedAnswer);
	container.appendChild(comparison);
}

function renderMatchingReviewItem(item) {
	const wrapper = document.createElement("div");
	wrapper.className = `matching-review-item ${item.correct ? "review-correct" : "review-incorrect"}`;
	const image = document.createElement("img");
	image.className = "review-image";
	image.src = item.image;
	image.alt = item.imageAlt;
	image.onerror = () => image.remove();
	wrapper.appendChild(image);
	appendAnswerComparison(wrapper, item.studentAnswer, item.correctAnswer);
	return wrapper;
}

function renderReview() {
	const container = document.getElementById("reviewContainer");
	container.innerHTML = "";
	reviewData.filter(review => reviewFilter === "all" || (reviewFilter === "correct" ? review.correct : !review.correct)).forEach(review => {
		const card = document.createElement("article");
		card.className = `review-card ${review.correct ? "review-correct" : "review-incorrect"}`;
		const heading = document.createElement("h4");
		heading.textContent = `Question ${review.questionNumber}`;
		const section = document.createElement("p");
		section.className = "review-section";
		section.textContent = review.section;
		card.append(heading, section);
		if (review.question) {
			const question = document.createElement("p");
			question.className = "review-question";
			question.textContent = review.question;
			card.appendChild(question);
		}
		if (review.type === "matching") review.items.forEach(item => card.appendChild(renderMatchingReviewItem(item)));
		else if (review.type === "unscramble") review.items.forEach(item => card.appendChild(renderUnscrambleReviewItem(item)));
		else {
			appendReviewMedia(card, review);
			appendAnswerComparison(card, review.studentAnswer, review.correctAnswer);
		}
		const result = document.createElement("p");
		result.className = "review-result";
		result.textContent = `${review.correct ? "✓ Correct" : review.studentAnswer === "Not answered" ? "✗ Not answered" : "✗ Incorrect"}  ${review.pointsEarned} / ${review.pointsAvailable} points`;
		card.appendChild(result);
		container.appendChild(card);
	});
}

function setReviewFilter(filter) {
	reviewFilter = filter;
	document.querySelectorAll(".review-filter").forEach(button => button.classList.remove("active"));
	document.getElementById(`${filter === "all" ? "all" : filter}ReviewBtn`).classList.add("active");
	updateQuestionNavigator();
	renderReview();
}

function resetReviewFilter() {
	reviewFilter = "all";
	document.querySelectorAll(".review-filter").forEach(button => button.classList.remove("active"));
	document.getElementById("allReviewBtn").classList.add("active");
}

startBtn.addEventListener("click", startExam);
nextBtn.addEventListener("click", () => goToQuestion(currentIndex + 1));
previousBtn.addEventListener("click", () => goToQuestion(currentIndex - 1));
submitBtn.addEventListener("click", () => {
	saveCurrentAnswer();
	const unanswered = questions.filter((question, index) => !hasAnswer(answers[index])).length;
	if (unanswered && !window.confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Are you sure you want to submit?`)) return;
	finishExam();
});
backToResultsBtn.addEventListener("click", () => {
	reviewMode = false;
	examScreen.hidden = true;
	resultsScreen.hidden = false;
	updateQuestionNavigator();
});
retryBtn.addEventListener("click", async () => {
	answers = [];
	score = 0;
	reviewData = [];
	reviewMode = false;
	currentIndex = 0;
	resetReviewFilter();
	document.getElementById("reviewContainer").innerHTML = "";
	clearSavedAttempt();
	startBtn.disabled = true;
	loadStatus.textContent = "Generating a new exam attempt...";
	try {
		await createNewQuestionSet();
		setupExamInfo();
		loadStatus.textContent = `${questions.length} new randomized questions ready.`;
	} catch (error) {
		loadStatus.textContent = `Unable to generate a new attempt: ${error.message}`;
		loadStatus.className = "exam-load-status exam-load-error";
		return;
	} finally {
		startBtn.disabled = false;
	}
	startScreen.hidden = false;
	resultsScreen.hidden = true;
});
document.getElementById("allReviewBtn").addEventListener("click", () => setReviewFilter("all"));
document.getElementById("incorrectReviewBtn").addEventListener("click", () => setReviewFilter("incorrect"));
document.getElementById("correctReviewBtn").addEventListener("click", () => setReviewFilter("correct"));
document.getElementById("reviewMistakesBtn").addEventListener("click", () => {
	setReviewFilter("incorrect");
	const firstMistake = reviewData.findIndex(review => !review.correct);
	if (firstMistake >= 0) enterReviewMode(firstMistake);
});

loadExam();
