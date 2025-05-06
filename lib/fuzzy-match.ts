// Simple implementation of string similarity (Levenshtein distance)
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null))

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost, // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

// Calculate similarity ratio (0-100)
export function similarityRatio(a: string, b: string): number {
  const distance = levenshteinDistance(a, b)
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 100 // Both strings are empty
  return Math.round((1 - distance / maxLength) * 100)
}
