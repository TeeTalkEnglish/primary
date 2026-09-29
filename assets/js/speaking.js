function toggleVietnamese(number) {

    const translation = document.getElementById(
        "vietnamese" + number
    );

    if (!translation) {
        console.error(
            "Vietnamese translation not found:",
            "vietnamese" + number
        );
        return;
    }

    translation.classList.toggle("show");
}


function showAnswer(number) {

    const answer = document.getElementById(
        "answer" + number
    );

    if (!answer) {
        console.error(
            "Answer not found:",
            "answer" + number
        );
        return;
    }

    answer.classList.toggle("show");
}


function completeLevel() {

    const message =
        document.getElementById("completeMessage");

    if (message) {

        message.textContent =
            "Great job! You completed Level 1.";

    }

}