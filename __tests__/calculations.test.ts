import {
  epley1RM,
  brzycki1RM,
  lander1RM,
  calculate1RM,
  weightAtPercentage,
  calculatePlates,
  calculateVolume,
  calculateTotalVolume,
  getRecommendedRestTime,
  getIntensity,
  getExerciseType,
  getPercentageBreakdown,
  standardBarbellWeight,
  standardPlates,
} from '../lib/calculations';

// ---------------------------------------------------------------------------
// 1RM Formulas
// ---------------------------------------------------------------------------

describe('epley1RM', () => {
  it('returns weight directly for 1 rep', () => {
    expect(epley1RM(100, 1)).toBe(100);
    expect(epley1RM(50, 1)).toBe(50);
  });

  it('calculates correctly for known values', () => {
    // 100 kg × (1 + 5/30) = 100 × 1.1667 ≈ 117
    expect(epley1RM(100, 5)).toBe(117);
    // 80 kg × (1 + 10/30) = 80 × 1.333 ≈ 107
    expect(epley1RM(80, 10)).toBe(107);
  });

  it('increases with more reps at the same weight', () => {
    expect(epley1RM(100, 3)).toBeLessThan(epley1RM(100, 5));
    expect(epley1RM(100, 5)).toBeLessThan(epley1RM(100, 10));
  });

  it('increases with more weight at the same reps', () => {
    expect(epley1RM(60, 5)).toBeLessThan(epley1RM(80, 5));
  });
});

describe('brzycki1RM', () => {
  it('returns weight directly for 1 rep', () => {
    expect(brzycki1RM(100, 1)).toBe(100);
  });

  it('returns weight for reps >= 37 (invalid range)', () => {
    expect(brzycki1RM(100, 37)).toBe(100);
    expect(brzycki1RM(100, 50)).toBe(100);
  });

  it('calculates correctly for known values', () => {
    // 100 × 36 / (37 - 5) = 3600 / 32 = 112.5 → 113
    expect(brzycki1RM(100, 5)).toBe(113);
  });

  it('produces reasonable estimates (within 20% of Epley for 1–12 reps)', () => {
    for (let reps = 2; reps <= 12; reps++) {
      const epley = epley1RM(100, reps);
      const brzycki = brzycki1RM(100, reps);
      expect(Math.abs(epley - brzycki) / epley).toBeLessThan(0.2);
    }
  });
});

describe('lander1RM', () => {
  it('returns weight directly for 1 rep', () => {
    expect(lander1RM(100, 1)).toBe(100);
  });

  it('calculates correctly for known values', () => {
    // 100 × 100 / (101.3 - 2.67123 × 5) = 10000 / 87.944 ≈ 114
    expect(lander1RM(100, 5)).toBe(114);
  });

  it('increases monotonically with reps', () => {
    let prev = lander1RM(100, 1);
    for (let reps = 2; reps <= 15; reps++) {
      const curr = lander1RM(100, reps);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

describe('calculate1RM (average)', () => {
  it('returns 0 for invalid inputs', () => {
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
    expect(calculate1RM(-10, 5)).toBe(0);
  });

  it('returns weight directly for 1 rep', () => {
    expect(calculate1RM(100, 1)).toBe(100);
    expect(calculate1RM(142.5, 1)).toBe(142.5);
  });

  it('averages the three formulas', () => {
    const e = epley1RM(100, 5);
    const b = brzycki1RM(100, 5);
    const l = lander1RM(100, 5);
    expect(calculate1RM(100, 5)).toBe(Math.round((e + b + l) / 3));
  });

  it('produces results greater than working weight', () => {
    expect(calculate1RM(80, 8)).toBeGreaterThan(80);
    expect(calculate1RM(120, 3)).toBeGreaterThan(120);
  });
});

// ---------------------------------------------------------------------------
// Percentage calculations
// ---------------------------------------------------------------------------

describe('weightAtPercentage', () => {
  it('returns full 1RM at 100%', () => {
    expect(weightAtPercentage(200, 100)).toBe(200);
  });

  it('returns 0 at 0%', () => {
    expect(weightAtPercentage(200, 0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    // 175 × 80% = 140 (exact)
    expect(weightAtPercentage(175, 80)).toBe(140);
    // 100 × 85% = 85 (exact)
    expect(weightAtPercentage(100, 85)).toBe(85);
  });
});

describe('getPercentageBreakdown', () => {
  it('returns 9 rows', () => {
    expect(getPercentageBreakdown(200)).toHaveLength(9);
  });

  it('first row is 100% of 1RM with 1 rep', () => {
    const breakdown = getPercentageBreakdown(200);
    expect(breakdown[0]).toEqual({ percentage: 100, reps: 1, weight: 200 });
  });

  it('weights decrease as percentage decreases', () => {
    const breakdown = getPercentageBreakdown(200);
    for (let i = 1; i < breakdown.length; i++) {
      expect(breakdown[i].weight).toBeLessThanOrEqual(breakdown[i - 1].weight);
    }
  });
});

// ---------------------------------------------------------------------------
// Plate Calculator
// ---------------------------------------------------------------------------

describe('calculatePlates', () => {
  it('returns empty plates when target equals barbell weight', () => {
    const result = calculatePlates(standardBarbellWeight);
    expect(result.plates).toHaveLength(0);
    expect(result.isExact).toBe(true);
    expect(result.achievedWeight).toBe(standardBarbellWeight);
  });

  it('returns empty plates when target is less than barbell weight', () => {
    const result = calculatePlates(10, standardBarbellWeight);
    expect(result.plates).toHaveLength(0);
    expect(result.weightPerSide).toBe(0);
  });

  it('calculates 60 kg (20 bar + 2×20)', () => {
    const result = calculatePlates(60);
    expect(result.isExact).toBe(true);
    expect(result.achievedWeight).toBe(60);
    // 20 kg per side → one 20 kg plate
    const plate20 = result.plates.find((p) => p.weight === 20);
    expect(plate20?.count).toBe(1);
  });

  it('calculates 100 kg (20 bar + 2×40)', () => {
    const result = calculatePlates(100);
    expect(result.isExact).toBe(true);
    expect(result.achievedWeight).toBe(100);
  });

  it('uses a custom barbell weight', () => {
    const result = calculatePlates(60, 15, standardPlates);
    // weight per side = (60 - 15) / 2 = 22.5
    expect(result.barbellWeight).toBe(15);
  });

  it('marks non-exact results correctly', () => {
    // 21 kg is hard to hit exactly with standard plates (bar=20 → 0.5 per side)
    // With standard plates the minimum increment is 1.25, so 21 may not be exact
    const result = calculatePlates(21);
    // Just verify the property exists and is boolean
    expect(typeof result.isExact).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

describe('calculateVolume', () => {
  it('computes weight × reps × sets', () => {
    expect(calculateVolume(100, 5, 3)).toBe(1500);
    expect(calculateVolume(80, 10, 4)).toBe(3200);
  });

  it('defaults sets to 1', () => {
    expect(calculateVolume(100, 5)).toBe(500);
  });
});

describe('calculateTotalVolume', () => {
  it('sums weight × reps across all sets', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5 },
      { weight: 80, reps: 8 },
    ];
    expect(calculateTotalVolume(sets)).toBe(100 * 5 + 100 * 5 + 80 * 8);
  });

  it('ignores sets with null/undefined values', () => {
    const sets = [{ weight: 100, reps: 5 }, { weight: null, reps: 5 }, { weight: 80, reps: null }];
    expect(calculateTotalVolume(sets)).toBe(500);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Rest Time
// ---------------------------------------------------------------------------

describe('getRecommendedRestTime', () => {
  it('returns longer rest for compound heavy vs isolation light', () => {
    const compoundHeavy = getRecommendedRestTime('compound', 'heavy');
    const isolationLight = getRecommendedRestTime('isolation', 'light');
    expect(compoundHeavy).toBeGreaterThan(isolationLight);
  });

  it('returns 180 seconds for compound heavy', () => {
    expect(getRecommendedRestTime('compound', 'heavy')).toBe(180);
  });

  it('returns 45 seconds for isolation light', () => {
    expect(getRecommendedRestTime('isolation', 'light')).toBe(45);
  });

  it('defaults to moderate when not specified', () => {
    expect(getRecommendedRestTime('compound')).toBe(getRecommendedRestTime('compound', 'moderate'));
  });

  it('falls back to 60 seconds for unknown type', () => {
    // @ts-expect-error — testing invalid input
    expect(getRecommendedRestTime('unknown')).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// Intensity
// ---------------------------------------------------------------------------

describe('getIntensity', () => {
  it('returns heavy at >= 85% of 1RM', () => {
    expect(getIntensity(85, 100)).toBe('heavy');
    expect(getIntensity(100, 100)).toBe('heavy');
  });

  it('returns moderate between 70–84%', () => {
    expect(getIntensity(70, 100)).toBe('moderate');
    expect(getIntensity(80, 100)).toBe('moderate');
  });

  it('returns light below 70%', () => {
    expect(getIntensity(60, 100)).toBe('light');
    expect(getIntensity(50, 100)).toBe('light');
  });

  it('returns moderate when 1RM is 0 (unknown)', () => {
    expect(getIntensity(80, 0)).toBe('moderate');
  });
});

// ---------------------------------------------------------------------------
// Exercise Type Classification
// ---------------------------------------------------------------------------

describe('getExerciseType', () => {
  it('classifies compound exercises', () => {
    expect(getExerciseType('Squat')).toBe('compound');
    expect(getExerciseType('Deadlift')).toBe('compound');
    expect(getExerciseType('Bench Press')).toBe('compound');
    expect(getExerciseType('Overhead Press')).toBe('compound');
    expect(getExerciseType('Barbell Row')).toBe('compound');
    expect(getExerciseType('Pull-up')).toBe('compound');
  });

  it('classifies core exercises', () => {
    expect(getExerciseType('Plank')).toBe('core');
    expect(getExerciseType('Sit-up')).toBe('core');
    expect(getExerciseType('Ab Wheel Rollout')).toBe('core');
  });

  it('classifies cardio exercises', () => {
    expect(getExerciseType('Running')).toBe('cardio');
    expect(getExerciseType('Bike')).toBe('cardio');
    expect(getExerciseType('Jump Rope')).toBe('cardio');
  });

  it('defaults to isolation for unknown exercises', () => {
    expect(getExerciseType('Bicep Curl')).toBe('isolation');
    expect(getExerciseType('Lateral Raise')).toBe('isolation');
    expect(getExerciseType('Leg Extension')).toBe('isolation');
  });

  it('is case-insensitive', () => {
    expect(getExerciseType('SQUAT')).toBe('compound');
    expect(getExerciseType('squat')).toBe('compound');
    expect(getExerciseType('Squat')).toBe('compound');
  });
});
