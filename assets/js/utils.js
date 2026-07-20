// ======================================
// Shared Utility Functions
// ======================================

function shuffle(array) {

    return [...array].sort(() => Math.random() - 0.5);

}


// ======================================
// Shared Button Helpers
// ======================================

function bindButton(id, callback) {

    const button = document.getElementById(id);

    if (button) {

        button.onclick = callback;

    }

}