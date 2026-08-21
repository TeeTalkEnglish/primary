const params = new URLSearchParams(window.location.search);
const grade = params.get("grade") || "1";
const examType = params.get("type") || "midterm";
const examPath = `../../assets/data/grade${grade}/${examType}.json`;

let examData = {};
let questions = [];
let currentIndex = 0;
let answers = [];
let score = 0;

const startScreen = document.getElementById("startScreen");
const examScreen = document.getElementById("examScreen");
const resultsScreen = document.getElementById("resultsScreen");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const previousBtn = document.getElementById("previousBtn");
const submitBtn = document.getElementById("submitBtn");
const retryBtn = document.getElementById("retryBtn");
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
	startScreen.hidden = true;
	resultsScreen.hidden = true;
	examScreen.hidden = false;
	showQuestion();
}

function showQuestion() {
	const question = questions[currentIndex];
	renderQuestion(question, currentIndex + 1, questions.length);
	restoreAnswer(question);
	document.getElementById("sectionTitle").textContent = sectionTitle(question);
	updateProgress();
	previousBtn.hidden = currentIndex === 0;
	nextBtn.hidden = currentIndex === questions.length - 1;
	submitBtn.hidden = currentIndex !== questions.length - 1;
}

function restoreAnswer(question) {
	const answer = answers[currentIndex];
	if (answer === undefined || answer === null) return;
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
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return document.querySelector(".option.selected")?.dataset.answerValue ?? null;
	}
	return document.getElementById("textAnswer")?.value || "";
}

function saveCurrentAnswer() {
	answers[currentIndex] = getCurrentAnswer(questions[currentIndex]);
}

function normalize(value) {
	return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(question, answer) {
	if (answer === null || answer === undefined) return false;
	if (["choice", "listen-choice", "listen-number", "picture-choice", "reading"].includes(question.type)) {
		return Number(answer) === Number(question.answer);
	}
	if (Array.isArray(question.answer)) return question.answer.some(item => normalize(item) === normalize(answer));
	return normalize(answer) === normalize(question.answer);
}

function calculateScore() {
	score = questions.reduce((total, question, index) => total + (isCorrect(question, answers[index]) ? Number(question.points || 1) : 0), 0);
}

function updateProgress() {
	const percent = Math.round(((currentIndex + 1) / questions.length) * 100);
	document.getElementById("progressFill").style.width = `${percent}%`;
	document.getElementById("progressText").textContent = `${percent}%`;
	document.getElementById("questionProgress").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
}

function finishExam() {
	calculateScore();
	examScreen.hidden = true;
	resultsScreen.hidden = false;
	const totalPoints = questions.reduce((total, question) => total + Number(question.points || 1), 0);
	const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
	document.getElementById("score").textContent = score;
	document.getElementById("percentage").textContent = `${percentage}%`;
	document.getElementById("resultMessage").textContent = percentage >= 80 ? "Great work!" : "Keep practicing!";
	const sectionResults = {};
	questions.forEach((question, index) => {
		const key = question.section || "general";
		sectionResults[key] ||= { score: 0, total: 0 };
		sectionResults[key].total += Number(question.points || 1);
		if (isCorrect(question, answers[index])) sectionResults[key].score += Number(question.points || 1);
	});
	document.getElementById("sectionResults").innerHTML = Object.entries(sectionResults).map(([key, result]) =>
		`<div class="section-result"><span>${sectionTitle({ section: key })}</span><strong>${result.score} / ${result.total}</strong></div>`
	).join("");
}

startBtn.addEventListener("click", startExam);
nextBtn.addEventListener("click", () => { saveCurrentAnswer(); currentIndex++; showQuestion(); });
previousBtn.addEventListener("click", () => { saveCurrentAnswer(); currentIndex--; showQuestion(); });
submitBtn.addEventListener("click", () => { saveCurrentAnswer(); finishExam(); });
retryBtn.addEventListener("click", () => { answers = []; score = 0; startScreen.hidden = false; resultsScreen.hidden = true; });

loadExam();
