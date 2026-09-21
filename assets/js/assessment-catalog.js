(function () {
    const grade = document.body.dataset.grade;
    const container = document.getElementById("assessmentList");
    if (!grade || !container) return;

    fetch(`../assets/data/grade${grade}/assessments.json`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(catalog => {
            container.innerHTML = "";
            catalog.periods.forEach(period => {
                const group = document.createElement("section");
                group.className = "assessment-group";

                const title = document.createElement("h3");
                title.className = "assessment-period";
                title.textContent = period.title;
                group.appendChild(title);

                const tests = document.createElement("div");
                tests.className = "cards assessment-tests";
                const periodAssessments = [
                    ...(period.data ? [{
                        id: period.id,
                        title: period.title,
                        description: period.description,
                        data: period.data,
                        direct: true
                    }] : []),
                    ...((period.tests || []).map(test => ({ ...test, direct: false })))
                ];

                periodAssessments.forEach(test => {
                    const card = document.createElement("a");
                    const directData = test.direct ? `&data=${encodeURIComponent(`../../assets/data/grade${grade}/${test.data}`)}` : "";
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
