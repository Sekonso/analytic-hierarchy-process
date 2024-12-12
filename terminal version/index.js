const readline = require("readline");

// MAIN program
main();
function main() {
  // AHP
  const goal = "Ranking Mobil terbaik";
  const criteria = ["Style", "Keandalan", "Bahan bakar"];
  const alternatives = ["Avanza", "Xenia", "Ertiga", "Grand Livina"];
  ahp(goal, criteria, alternatives);
}

// AHP Utils
async function ahp(goal = "", criteria = [], alternatives = []) {
  // Initialization
  console.log("===========================");
  console.log("Analytical Hierarhy Process");
  console.log(`Tujuan: ${goal}`);
  console.log("===========================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Weight calculations
  console.log("---------------------------");
  console.log("Perbandingan bobot kritera:");
  console.log("---------------------------");

  const criteriaMatrix = await pairwiseComparator(criteria, rl);
  const normalizedCriteria = normalization(criteriaMatrix);

  // Alternatives calculations
  const alternativesTables = {};
  for (const criterion of criteria) {
    console.log("-------------------------------------------");
    console.log(`Perbandingan bobot kriteria ${criterion}:`);
    console.log("-------------------------------------------");

    const criterionMatrix = await pairwiseComparator(alternatives, rl);
    const normalizedCriterion = normalization(criterionMatrix);
    alternativesTables[`${criterion}`] = normalizedCriterion;
  }

  // Score calculations
  const ranking = [];

  for (const [key, criterion] of Object.entries(alternativesTables)) {
    criterion.finalWeights = criterion.weights.map((weight) => weight * normalizedCriteria.weights[criteria.indexOf(key)]);
  }

  alternatives.forEach((alternative, idx) => {
    let score = 0;

    criteria.forEach((criterion) => {
      score += alternativesTables[criterion].finalWeights[idx];
    });

    ranking.push({ alternative, score });
  });

  console.log("\n------------------------");
  console.log(`${goal}:`);
  console.log("------------------------");
  ranking.forEach((item, index) => {
    console.log(`${index + 1}. ${item.alternative} - Score: ${item.score.toFixed(3)}`);
  });

  // Finishing
  rl.close();
  console.log("\nFinish");
}

async function pairwiseComparator(reference = [], rl) {
  const matrix = matrixMaker(reference.length);

  for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
    for (let columnIdx = 0; columnIdx < matrix.length; columnIdx++) {
      // Comparison
      if (rowIdx === columnIdx) {
        matrix[rowIdx][columnIdx] = 1;
        continue;
      } else if (matrix[rowIdx][columnIdx] !== null) {
        continue;
      }

      const comparisonValue = await askQuestion(
        rl,
        `Berapa nilai ${reference[rowIdx]} dibanding ${reference[columnIdx]}? (-9 sampai 9, tidak boleh nol): `
      );

      // Validation
      const parsedValue = parseFloat(comparisonValue);
      if (isNaN(parsedValue) || parsedValue === 0 || parsedValue < -9 || parsedValue > 9) {
        console.log("Input harus berupa angka antara -9 dan 9 (tidak boleh nol). Coba lagi.");
        columnIdx--;
        continue;
      }

      // Axioma reciprocal
      if (parsedValue < 0) {
        matrix[rowIdx][columnIdx] = 1 / Math.abs(parsedValue);
        matrix[columnIdx][rowIdx] = Math.abs(parsedValue);
      } else {
        matrix[rowIdx][columnIdx] = parsedValue;
        matrix[columnIdx][rowIdx] = 1 / parsedValue;
      }
    }
  }

  return matrix;
}

function normalization(matrix = [[]]) {
  if (!matrix.length || matrix.some(row => !row.length)) {
    throw new Error("Invalid matrix: Matrix cannot be empty.");
  }

  const normalizedMatrix = matrix;
  const totals = [];
  const vectors = [];
  const weights = [];

  // Totals calculation
  for (let column = 0; column < matrix.length; column++) {
    let columnTotal = 0;

    for (let row = 0; row < matrix.length; row++) {
      columnTotal += matrix[row][column];
    }
    totals.push(columnTotal);
  }

  // Matrix normalization
  for (let column = 0; column < matrix.length; column++) {
    for (let row = 0; row < matrix.length; row++) {
      normalizedMatrix[row][column] = matrix[row][column] / totals[column];
    }
  }

  // Vectors calculation
  for (let row = 0; row < normalizedMatrix.length; row++) {
    let rowTotal = 0;
    for (let column = 0; column < normalizedMatrix.length; column++) {
      rowTotal += normalizedMatrix[row][column];
    }

    vectors.push(rowTotal);
  }

  // Weight calculation
  for (let vector = 0; vector < vectors.length; vector++) {
    weights.push(vectors[vector] / normalizedMatrix.length);
  }

  return {
    normalizedMatrix,
    totals,
    vectors,
    weights
  };
}

// GENERAL UTILS

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (input) => resolve(input));
  });
}

function matrixMaker(length) {
  return Array.from({ length }, () => Array(length).fill(null));
}

