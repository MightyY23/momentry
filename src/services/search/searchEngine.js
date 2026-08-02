//---------------------------------------
// Normalize
//---------------------------------------

function normalize(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim();
}

//---------------------------------------
// Levenshtein Distance
//---------------------------------------

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

//---------------------------------------
// Similarity
//---------------------------------------

function similarity(a, b) {
  if (!a || !b) return 0;

  const distance = levenshtein(a, b);

  return (
    1 -
    distance /
      Math.max(a.length, b.length)
  );
}

//---------------------------------------
// Smart Search
//---------------------------------------

export function searchMemories(
  moments = [],
  query = ""
) {
  const search = normalize(query);

  //---------------------------------------

  if (!search) {
    return [...moments].sort(
      (a, b) =>
        new Date(b.memory_date) -
        new Date(a.memory_date)
    );
  }

  //---------------------------------------

  return moments
    .map((moment) => {
      let score = 0;

      const title = normalize(
        moment.title
      );

      const description =
        normalize(
          moment.description
        );

      const location =
        normalize(
          moment.location
        );

      const category =
        normalize(
          moment.category
        );

      //---------------------------------------
      // Exact Matches
      //---------------------------------------

      if (title.includes(search))
        score += 100;

      if (title.startsWith(search))
        score += 40;

      if (location.includes(search))
        score += 60;

      if (category.includes(search))
        score += 40;

      if (
        description.includes(search)
      )
        score += 20;

      //---------------------------------------
      // Fuzzy Matching
      //---------------------------------------

      if (
        similarity(title, search) >
        0.65
      )
        score += 70;

      if (
        similarity(location, search) >
        0.65
      )
        score += 40;

      //---------------------------------------

      return {
        ...moment,
        score,
      };
    })
    .filter(
      (moment) => moment.score > 0
    )
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        new Date(b.memory_date) -
        new Date(a.memory_date)
      );
    });
}