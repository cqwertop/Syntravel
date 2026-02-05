export function scoreOption(option) {
  return (
    option.price * 0.5 +
    option.duration * 0.3 -
    option.rating * 10
  );
}

export function pickBest(options) {
  return options
    .map(o => ({ ...o, score: scoreOption(o) }))
    .sort((a, b) => a.score - b.score);
}
