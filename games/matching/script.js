(() => {
	function imagePath(grade, unit, filename) {
		return `../../assets/images/grade${grade}/unit${unit}/${filename}`;
	}

	function shuffle(items) {
		return [...items].sort(() => Math.random() - 0.5);
	}

	function createMatchingGame(container, config) {
		const items = config.items || [];
		const selectedAnswers = Array(items.length).fill(null);
		const choices = shuffle(items.map((item, index) => ({
			label: item.label || item.answer,
			value: item.answer,
			index
		})));

		container.innerHTML = "";
		container.className = `${container.className} matching-game`;
		const instructions = document.createElement("p");
		instructions.className = "matching-instructions";
		instructions.textContent = config.instructions || "Look at each picture and choose the matching word.";
		container.appendChild(instructions);

		const board = document.createElement("div");
		board.className = "matching-board";
		items.forEach((item, itemIndex) => {
			const row = document.createElement("div");
			row.className = "matching-row";
			const image = document.createElement("img");
			image.className = "matching-image";
			image.src = item.imagePath || imagePath(config.grade, item.unit || config.unit, item.image);
			image.alt = item.imageAlt || item.answer;
			image.onerror = () => image.remove();

			const choicesContainer = document.createElement("div");
			choicesContainer.className = "matching-choices";
			choices.forEach(choice => {
				const button = document.createElement("button");
				button.type = "button";
				button.className = "matching-choice";
				button.textContent = choice.label;
				button.dataset.value = choice.value;
				button.addEventListener("click", () => {
					selectedAnswers[itemIndex] = choice.value;
					row.querySelectorAll(".matching-choice").forEach(option => option.classList.remove("selected"));
					button.classList.add("selected");
					config.onChange?.(selectedAnswers.slice());
				});
				choicesContainer.appendChild(button);
			});
			row.append(image, choicesContainer);
			board.appendChild(row);
		});
		container.appendChild(board);

		return {
			getAnswer: () => selectedAnswers.slice(),
			setAnswer: answer => {
				if (!Array.isArray(answer)) return;
				answer.forEach((value, itemIndex) => {
					selectedAnswers[itemIndex] = value;
					const row = board.children[itemIndex];
					row?.querySelectorAll(".matching-choice").forEach(button => {
						button.classList.toggle("selected", button.dataset.value === String(value));
					});
				});
			},
			destroy: () => { container.innerHTML = ""; }
		};
	}

	window.MatchingGame = { create: createMatchingGame };
})();
