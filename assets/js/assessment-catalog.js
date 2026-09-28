(function () {
    const params = new URLSearchParams(window.location.search);
    const grade = params.get("grade");

    const container = document.getElementById("assessmentList");

    if (!grade || !container) return;

    fetch(`../assets/data/grade${grade}/assessments.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(catalog => {
            // your existing assessment rendering code
        })
        .catch(error => {
            console.error("Failed to load assessment catalog:", error);
            container.textContent =
                "Assessments are temporarily unavailable.";
        });
})();

card.href = `../games/assessment/index.html?grade=${grade}&period=${encodeURIComponent(period.id)}&test=${encodeURIComponent(test.id)}${dataParam}`;
                    card.className = "unit-card assessment-card";
                    card.href = `../games/assessment/index.html?grade=${grade}&period=${encodeURIComponent(period.id)}&test=${encodeURIComponent(test.id)}${directData}`;
                    card.innerHTML = `
                        <div class="unit-number">Assessment - ${test.title}</div>
                        <p>${test.description || "Assessment"}</p>
                        <span>Start Assessment</span>
                    `;
                    tests.appendChild(card);
                });

                if (!periodAssessments.length) {
                    const empty = document.createElement("p");
                    empty.className = "assessment-empty";
                    empty.textContent = "No assessment published yet.";
                    tests.appendChild(empty);
                }

                group.appendChild(tests);
                container.appendChild(group);
            });
        })
        .catch(error => {
            console.error("Failed to load assessment catalog:", error);
            container.textContent = "Assessments are temporarily unavailable.";
        });
})();
