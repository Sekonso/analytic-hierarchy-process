function ahp(criteria = [], alternatives = []) {
  const criteriaMatrix = pairwiseComparison(criteria, { isAlternatives: false, criterion: null });
  const normalizedCriteria = normalization(criteriaMatrix);

  // Alternatives calculations
  const alternativesTables = {};
  for (const criterion of criteria) {
    const criterionMatrix = pairwiseComparison(alternatives, {
      isAlternatives: true,
      criterion: criterion
    });
    const normalizedCriterion = normalization(criterionMatrix);
    alternativesTables[`${criterion}`] = normalizedCriterion;
  }

  // Score calculations
  for (const [key, criterion] of Object.entries(alternativesTables)) {
    criterion.finalWeights = criterion.weights.map(
      (weight) => weight * normalizedCriteria.weights[criteria.indexOf(key)]
    );
  }

  const result = {
    normalizedCriteria,
    alternativesTables
  };

  result.ranking = alternatives.map((alternative, idx) => {
    let score = 0;

    criteria.forEach((criterion) => {
      score += alternativesTables[criterion].finalWeights[idx];
    });

    return { alternative, score };
  });

  result.ranking.sort((a, b) => b.score - a.score);

  return result;
}

function pairwiseComparison(
  reference = [],
  alternatives = { isAlternatives: false, criterion: null }
) {
  const matrix = Array.from({ length: reference.length }, () => Array(reference.length).fill(null));

  for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
    for (let columnIdx = 0; columnIdx < matrix.length; columnIdx++) {
      // Comparison
      if (rowIdx === columnIdx) {
        matrix[rowIdx][columnIdx] = 1;
        continue;
      } else if (matrix[rowIdx][columnIdx] !== null) {
        continue;
      }

      let comparisonValue = 0;
      if (alternatives.isAlternatives) {
        comparisonValue = parseFloat(
          document.querySelector(
            `[data-criterion="${alternatives.criterion}"][data-value="${reference[rowIdx]},${reference[columnIdx]}"]`
          ).value
        );
      } else {
        comparisonValue = parseFloat(
          document.querySelector(`[data-value="${reference[rowIdx]},${reference[columnIdx]}"]`)
            .value
        );
      }
      const parsedValue = parseFloat(comparisonValue);

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
  const defaultMatrix = matrix;
  const normalizedMatrix = matrix;
  const totals = [];
  const vectors = [];
  const weights = [];

  // Totals calculation
  for (let column = 0; column < defaultMatrix.length; column++) {
    let columnTotal = 0;

    for (let row = 0; row < defaultMatrix.length; row++) {
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
    defaultMatrix,
    normalizedMatrix,
    totals,
    vectors,
    weights
  };
}

export default ahp;
