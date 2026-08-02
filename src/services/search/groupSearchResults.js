export function groupSearchResults(results = []) {
  const groups = {};

  results.forEach((result) => {
    if (!groups[result.type]) {
      groups[result.type] = [];
    }

    groups[result.type].push(result);
  });

  return groups;
}