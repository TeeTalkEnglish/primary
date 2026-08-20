// ============================================
// MIDTERM EXAM CONTROLLER
// Reusable for all grades
// ============================================

const params = new URLSearchParams(window.location.search);
const grade = params.get("grade") || 5;
const examPath = `../../../assets/data/grade${grade}/midterm.json`;

console.log("Exam grade:", grade);
console.log("Exam path:", examPath);

let questions = [];
let currentIndex = 0;
let score = 0;
let answers = [];
let examStarted = false;

const startScreen = document.getElementById("startScreen");
const examScreen = document.getElementById("examScreen");
const resultsScreen = document.getElementById("resultsScreen");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const previousBtn = document.getElementById("previousBtn");
const submitBtn = document.getElementById("submitBtn");
const retryBtn = document.getElementById("retryBtn");

const loadStatus = document.createElement("p");
loadStatus.id = "examLoadStatus";
loadStatus.setAttribute("role", "status");
startBtn?.insertAdjacentElement("afterend", loadStatus);

function showLoadStatus(message, isError = false) {
    loadStatus.textContent = message;
    loadStatus.className = isError ? "exam-load-error" : "exam-load-status";
}

function flattenQuestions(data) {
    if (Array.isArray(data.questions)) return data.questions;
    if (!Array.isArray(data.sections)) return [];

    return data.sections.flatMap(section => {
        if (!Array.isArray(section.questions)) return [];
        return section.questions.map(question => ({
            ...question,
            section: question.section || section.id,
            passage: question.passage || section.passage
        }));
    });
}

function loadExam() {
    if (!startBtn) return;

    startBtn.disabled = true;
    showLoadStatus("Loading exam questions...");

    fetch(examPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} while loading ${examPath}`);
            }
            return response.json();
        })
        .then(data => {
            questions = flattenQuestions(data);

            if (!questions.length) {
                throw new Error("The exam file contains no questions.");
            }

            console.log("Exam questions loaded:", questions.length);
            setupExamInfo(data);
            startBtn.disabled = false;
            showLoadStatus(`${questions.length} questions ready.`);
        })
        .catch(error => {
            console.error("Failed to load exam:", error);
            showLoadStatus(`Unable to load the exam: ${error.message}`, true);
        });
}

function setupExamInfo(data) {
    const title = document.querySelector(".exam-header h1");
    const subtitle = document.querySelector(".exam-header .exam-subtitle");

    if (title) title.textContent = data.title || `Grade ${grade} Midterm Exam`;
    if (subtitle && data.subtitle) subtitle.textContent = data.subtitle;
    document.title = data.title || `Grade ${grade} Midterm Exam`;

    document.querySelectorAll("#backBtn, #homeBtn").forEach(link => {
        link.textContent = link.id === "homeBtn"
            ? "← Back to Grade"
            : `← Back to Grade ${grade}`;
        link.href = "../../index.html";
    });
}

function startExam() {
    if (!questions.length) {
        showLoadStatus("The exam questions have not loaded yet.", true);
        return;
    }

    examStarted = true;
    currentIndex = 0;
    score = 0;
    answers = [];
    startScreen.style.display = "none";
    examScreen.style.display = "block";
    resultsScreen.style.display = "none";
    showQuestion();
}

function showQuestion() {
    if (currentIndex < 0 || currentIndex >= questions.length) {
        finishExam();
        return;
    }

    renderQuestion(questions[currentIndex], currentIndex + 1, questions.length);
    restoreAnswer();
    updateProgress();
    updateNavigation();
}

function restoreAnswer() {
    const answer = answers[currentIndex];
    if (answer === undefined || answer === null) return;

    const question = questions[currentIndex];
    if (question.type === "choice" || question.type === "listen-choice") {
        const input = document.querySelector(`input[name="questionAnswer"][value="${answer}"]`);
        if (input) input.checked = true;
    } else {
        const input = document.getElementById("textAnswer");
        if (input) input.value = answer;
    }
}

function updateProgress() {
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const questionProgress = document.getElementById("questionProgress");

    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
    if (questionProgress) questionProgress.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
}

function updateNavigation() {
    const lastQuestion = currentIndex === questions.length - 1;
    if (previousBtn) previousBtn.style.display = currentIndex === 0 ? "none" : "inline-block";
    if (nextBtn) nextBtn.style.display = lastQuestion ? "none" : "inline-block";
    if (submitBtn) submitBtn.style.display = lastQuestion ? "inline-block" : "none";
}

function saveCurrentAnswer() {
    const question = questions[currentIndex];
    if (question) answers[currentIndex] = getCurrentAnswer(question);
}

function getCurrentAnswer(question) {
    if (question.type === "choice" || question.type === "listen-choice") {
        return document.querySelector('input[name="questionAnswer"]:checked')?.value ?? null;
    }

    if (question.type === "fill" || question.type === "sentence") {
        return document.getElementById("textAnswer")?.value || "";
    }

    return "";
}

function checkQuestion(question, answer) {
    if (question.type === "choice" || question.type === "listen-choice") {
        return Number(answer) === Number(question.answer);
    }

    if (question.type === "fill" || question.type === "sentence") {
        return normalize(answer) === normalize(question.answer);
    }

    return false;
}

function calculateScore() {
    score = questions.reduce((total, question, index) => {
        return total + (checkQuestion(question, answers[index])
            ? Number(question.points || 1)
            : 0);
    }, 0);
}

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function finishExam() {
    examStarted = false;
    examScreen.style.display = "none";
    resultsScreen.style.display = "block";
    showResults();
}

function showResults() {
    const totalPoints = questions.reduce((total, question) => total + Number(question.points || 1), 0);
    const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
    const scoreElement = document.getElementById("score");
    const percentageElement = document.getElementById("percentage");
    const resultMessage = document.getElementById("resultMessage");
    const totalElement = document.querySelector(".score-total");
    const sectionResults = document.getElementById("sectionResults");

    if (scoreElement) scoreElement.textContent = score;
    if (percentageElement) percentageElement.textContent = `${percentage}%`;
    if (totalElement) totalElement.textContent = `/ ${totalPoints}`;
    if (resultMessage) {
        resultMessage.textContent = percentage >= 90 ? "Excellent work!"
            : percentage >= 80 ? "Great job!"
                : percentage >= 70 ? "Good work!"
                    : percentage >= 60 ? "Keep practicing!"
                        : "Let's review and try again.";
    }

    if (sectionResults) {
        const sections = questions.reduce((result, question, index) => {
            const section = question.section || "general";
            if (!result[section]) result[section] = { score: 0, total: 0 };
            const points = Number(question.points || 1);
            result[section].total += points;
            if (checkQuestion(question, answers[index])) result[section].score += points;
            return result;
        }, {});

        sectionResults.innerHTML = Object.entries(sections).map(([section, result]) => `
            <div class="section-result">
                <span>${section}</span>
                <strong>${result.score} / ${result.total}</strong>
            </div>
        `).join("");
    }
}

startBtn?.addEventListener("click", startExam);
nextBtn?.addEventListener("click", () => {
    saveCurrentAnswer();
    currentIndex++;
    showQuestion();
});
previousBtn?.addEventListener("click", () => {
    saveCurrentAnswer();
    currentIndex--;
    showQuestion();
});
submitBtn?.addEventListener("click", () => {
    saveCurrentAnswer();
    calculateScore();
    finishExam();
});
retryBtn?.addEventListener("click", () => {
    currentIndex = 0;
    score = 0;
    answers = [];
    startScreen.style.display = "block";
    resultsScreen.style.display = "none";
});

loadExam();