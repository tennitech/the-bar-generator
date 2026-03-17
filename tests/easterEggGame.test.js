const {
  computeDifficulty,
  formatArcadeScore,
  getScoreboardExtension,
  pickObstacleType,
  scoreToRank
} = require('../js/easter-egg.js');

describe('RinkRush helpers', () => {
  test('difficulty ramps speed up and tightens spawn cadence', () => {
    const opening = computeDifficulty(0);
    const lateGame = computeDifficulty(1800);

    expect(lateGame.speed).toBeGreaterThan(opening.speed);
    expect(lateGame.spawnEvery).toBeLessThan(opening.spawnEvery);
    expect(opening.obstacleWeights.split).toBe(0);
    expect(lateGame.obstacleWeights.split).toBeGreaterThan(0);
  });

  test('arcade score formatting preserves overflow and pads short scores', () => {
    expect(formatArcadeScore(7, 3)).toBe('007');
    expect(formatArcadeScore(482, 3)).toBe('482');
    expect(formatArcadeScore(1337, 3)).toBe('1337');
  });

  test('scoreboard extension only engages after 999', () => {
    expect(getScoreboardExtension(999)).toBe(0);
    expect(getScoreboardExtension(1000)).toBeGreaterThan(0);
    expect(getScoreboardExtension(1600)).toBe(1);
  });

  test('split obstacles are unavailable early and become eligible later', () => {
    expect(pickObstacleType(120, [], () => 0.9999)).not.toBe('split');
    expect(pickObstacleType(1800, [], () => 0.9999)).toBe('split');
  });

  test('ranking escalates with score and combo', () => {
    expect(scoreToRank(120, 1)).toBe('FRESH ICE');
    expect(scoreToRank(700, 3)).toBe('GLASS BREAKER');
    expect(scoreToRank(1500, 12)).toBe('PUCKMAN LEGEND');
  });
});
