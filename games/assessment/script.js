const params = new URLSearchParams(window.location.search);
const grade = params.get("grade") || "1";
const examType = params.get("type") || "midterm";
const examPath = `../../assets/data/grade${grade}/${examType}.json`;

let examData = {};
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

function flattenQuestions(data) {
	if (Array.isArray(data.questions)) return data.questions;
	if (!Array.isArray(data.sections)) return [];
	return data.sections.flatMap(section => (section.questions || []).map(question => ({
		...question,
		section: question.section || section.id,
		passage: question.passage || section.passage
	})));
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
	document.getElementById("examInfo").innerHTML = (examData.sections || []).map(section => `
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
		const response = await fetch(examPath);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		examData = await response.json();
		questions = flattenQuestions(examData);
		if (!questions.length) throw new Error("The exam file contains no questions.");
		setupExamInfo();
		startBtn.disabled = false;
		loadStatus.textContent = `${questions.length} questions ready.`;
	} catch (error) {
		loadStatus.textContent = `Unable to load ${examPath}: ${error.message}`;
		loadStatus.className = "exam-load-status exam-load-error";
	}
}

function startExam() {
	currentIndex = 0;
	answers = [];
	score = 0;
	reviewData = [];
	reviewFilter = "all";
	reviewMode = false;
	startScreen.hidden = true;
	resultsScreen.hidden = true;
	examScreen.hidden = false;
	showQuestion();
}

function showQuestion() {
	const question = questions[currentIndex];
	window.matchingController = null;
	window.matchingAnswer = null;
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
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return document.querySelector(".option.selected")?.dataset.answerValue ?? null;
	}
	return document.getElementById("textAnswer")?.value || "";
}

function saveCurrentAnswer() {
	if (reviewMode) return;
	answers[currentIndex] = getCurrentAnswer(questions[currentIndex]);
}

function goToQuestion(index) {
	if (index < 0 || index >= questions.length) return;
	if (!reviewMode) saveCurrentAnswer();
	currentIndex = index;
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
	appendAnswerComparison(details, review.studentAnswer, review.correctAnswer);
	const result = document.createElement("p");
	result.className = "review-result";
	result.textContent = `${review.correct ? "✓ Correct" : review.studentAnswer === "Not answered" ? "— Unanswered" : "✗ Incorrect"}  ${review.pointsEarned} / ${review.pointsAvailable} points`;
	details.appendChild(result);
	card.appendChild(details);
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
retryBtn.addEventListener("click", () => {
	answers = [];
	score = 0;
	reviewData = [];
	reviewMode = false;
	currentIndex = 0;
	resetReviewFilter();
	document.getElementById("reviewContainer").innerHTML = "";
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
