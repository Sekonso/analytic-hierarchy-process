import ahp from "./AHPutils.js";

// Selector
const decompositionForm = document.querySelector("#decomposition-form");
const addCriterionButton = document.querySelector("#add-criterion");
const addAlternativeButton = document.querySelector("#add-alternative");

let goal = "";
let criteria = [];
let alternatives = [];

decompositionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const goalInput = document.querySelector("#goal-input");
  const criteriaInput = document.querySelectorAll(".criterion-input");
  const alternativesInput = document.querySelectorAll(".alternative-input");

  goal = goalInput.value;

  criteria = [];
  criteriaInput.forEach((criterionInput) => {
    criteria.push(criterionInput.value);
  });

  alternatives = [];
  alternativesInput.forEach((alternativeInput) => {
    alternatives.push(alternativeInput.value);
  });

  const dynamicContent = document.querySelector("#dynamic-container");
  dynamicContent.innerHTML = `
      <form id="comparison-form"></form>
      <div id="result">
        <hr />
        <h2>Hasil Perhitungan</h2>
        <hr />
        <div id="result-container">-</div>
      </div>
  `;

  renderComparisonForm(criteria, alternatives);
});

addCriterionButton.addEventListener("click", () => {
  const criteriaInputGroup = document.querySelector("#criteria-input-group");
  const inputContainer = document.createElement("div");

  inputContainer.classList.add("input-container");
  inputContainer.innerHTML = `
    <input
      type="text"
      class="criterion-input decomposition-input"
      placeholder="Masukkan nama kriteria..."
      required
    />
    <button type="button" >Hapus</button>
  `;
  inputContainer.querySelector("button").addEventListener("click", () => inputContainer.remove());

  criteriaInputGroup.appendChild(inputContainer);
});

addAlternativeButton.addEventListener("click", () => {
  const criteriaInputGroup = document.querySelector("#alternatives-input-group");
  const inputContainer = document.createElement("div");

  inputContainer.classList.add("input-container");
  inputContainer.innerHTML = `
    <input
      type="text"
      class="alternative-input decomposition-input"
      placeholder="Masukkan nama alternatif..."
      required
    />
    <button type="button" >Hapus</button>
  `;
  inputContainer.querySelector("button").addEventListener("click", () => inputContainer.remove());

  criteriaInputGroup.appendChild(inputContainer);
});


function renderComparisonForm(criteria = [], alternatives = []) {
  const comparisonForm = document.querySelector("#comparison-form");

  comparisonForm.innerHTML = `
    <hr />
    <h2>Perbandingan kriteria dan alternatif</h2>
    <hr />

    <div id="comparison-container">
    </div>

    <button type="submit" class="full-button">Cek hasil</button>
  `;

  const comparisonContainer = comparisonForm.querySelector("#comparison-container");
  const comparisonContainerFragment = document.createDocumentFragment();

  comparisonContainerFragment.appendChild(createCriteriaComparison(criteria));
  comparisonContainerFragment.appendChild(createAlternativesComparison(criteria, alternatives));
  comparisonContainer.appendChild(comparisonContainerFragment);

  comparisonForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (validateComparisonInput()) {
      const result = ahp(criteria, alternatives);
      renderResult(result, goal, criteria, alternatives);
    }
  });
}

function validateComparisonInput() {
  let isValid = true;
  const allComparisonInput = document.querySelectorAll(".comparison-input");

  allComparisonInput.forEach((comparisonInput) => {
    const value = parseFloat(comparisonInput.value);

    if (isNaN(value) || value <= -9 || value >= 9 || value === 0) {
      alert("Input invalid, nilai harus berupa angka diantara (-9) hingga (9) dan tidak boleh nol");
      isValid = false;
    }
  });

  return isValid;
}

function createCriteriaComparison(criteria = []) {
  const comparisonInputGroup = document.createElement("div");
  comparisonInputGroup.classList.add("comparison-input-group");
  comparisonInputGroup.innerHTML = "<h3>Perbandingan Kriteria:</h3>";

  for (let i = 0; i < criteria.length; i++) {
    for (let j = 0; j < criteria.length; j++) {
      if (i < j) {
        const comparisonInputContainer = document.createElement("div");
        comparisonInputContainer.classList.add("comparison-input-container");

        comparisonInputContainer.innerHTML = `
          <label>${criteria[i]} dibanding ${criteria[j]}</label>
          <input 
            type="number" 
            class="comparison-input" 
            placeholder="(-9) hingga (9)" 
            value="1" min="-9" max="9" 
            data-value="${criteria[i]},${criteria[j]}" 
            required 
          />
        `;

        comparisonInputGroup.appendChild(comparisonInputContainer);
      }
    }
  }

  return comparisonInputGroup;
}

function createAlternativesComparison(criteria = [], alternatives = []) {
  const fragment = document.createDocumentFragment();

  for (const criterion of criteria) {
    const comparisonInputGroup = document.createElement("div");
    comparisonInputGroup.classList.add("comparison-input-group");
    comparisonInputGroup.innerHTML = `<h3>Perbandingan Alternatif (${criterion}):</h3>`;

    for (let i = 0; i < alternatives.length; i++) {
      for (let j = 0; j < alternatives.length; j++) {
        if (i < j) {
          const comparisonInputContainer = document.createElement("div");
          comparisonInputContainer.classList.add("comparison-input-container");

          comparisonInputContainer.innerHTML = `
            <label>${alternatives[i]} dibanding ${alternatives[j]}</label>
            <input 
              type="number" 
              class="comparison-input" 
              placeholder="(-9) hingga (9)" 
              value="1" min="-9" max="9" 
              data-criterion="${criterion}"
              data-value="${alternatives[i]},${alternatives[j]}" 
              required 
            />
          `;

          comparisonInputGroup.appendChild(comparisonInputContainer);
        }
      }
    }

    fragment.appendChild(comparisonInputGroup);
  }

  return fragment;
}

function renderResult(result, goal, criteria, alternatives) {
  const resultContainer = document.querySelector("#result-container");
  const resultFragment = document.createDocumentFragment();

  resultContainer.innerHTML = "";

  resultFragment.appendChild(
    createResultGroup("Bobot kriteria", result.normalizedCriteria.weights, criteria)
  );

  for (const criterion of criteria) {
    resultFragment.appendChild(
      createResultGroup(
        `Bobot alternatif (${criterion})`,
        result.alternativesTables[`${criterion}`].weights,
        alternatives
      )
    );
  }

  resultFragment.appendChild(createRanking(goal, result.ranking));

  resultContainer.appendChild(resultFragment);
}

function createResultGroup(header = "", data = [], reference = []) {
  const resultGroup = document.createElement("div");
  resultGroup.classList.add("result-group");

  resultGroup.innerHTML = `
    <h3>${header}</h3>
    <table class="result-table">
    </table>
  `;

  const resultTable = resultGroup.querySelector("table");
  data.forEach((datum, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <th>${reference[idx]}</th>
      <td>${datum.toFixed(3)}</td>
    `;
    resultTable.appendChild(tr);
  });

  return resultGroup;
}

function createRanking(goal, ranking) {
  const resultGroup = document.createElement("div");
  resultGroup.classList.add("result-group");

  resultGroup.innerHTML = `
    <h3>Hasil Perankingan ${goal}</h3>
    <table class="rank-table">
  `;

  const resultTable = resultGroup.querySelector("table");
  ranking.forEach((rank, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <th>${idx + 1}</th>
      <td>${rank.alternative}</td>
      <td>${rank.score.toFixed(3)}</td>
    `;
    resultTable.appendChild(tr);
  });

  return resultGroup;
}
