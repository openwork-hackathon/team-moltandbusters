export function calculatePoints(guessCount) {
  return Math.max(1, 101 - guessCount * 10);
}
