import {
  epley1RM,
  brzycki1RM,
  lander1RM,
  calculate1RM,
  weightAtPercentage,
  getPercentageBreakdown,
  calculatePlates,
  calculateVolume,
  calculateTotalVolume,
  getRecommendedRestTime,
  getIntensity,
  getExerciseType,
  standardBarbellWeight,
} from '../lib/calculations';

describe('1RM Formulas', () => {
  describe('epley1RM', () => {
    it('returns the weight itself for 1 rep', () => {
      expect(epley1RM(100, 1)).toBe(100);
    });

    it('calculates correctly for multiple reps', () => {
      // 100 * (1 + 5/30) = 100 * 1.1667 ≈ 117
      expect(epley1RM(100, 5)).toBe(117);
    });

    it('handles high reps', () => {
      expect(epley1RM(50, 20)).toBe(83);
    });
  });

  describe('brzycki1RM', () => {
    it('returns the weight itself for 1 rep', () => {
      expect(brzycki1RM(100, 1)).toBe(100);
    });

    it('calculates correctly for multiple reps', () => {
      // 100 * 36 / (37 - 5) = 3600 / 32 = 112.5 ≈ 113
      expect(brzycki1RM(100, 5)).toBe(113);
    });

    it('returns weight for 37+ reps (invalid)', () => {
      expect(brzycki1RM(100, 37)).toBe(100);
      expect(brzycki1RM(100, 50)).toBe(100);
    });
  });

  describe('lander1RM', () => {
    it('returns the weight itself for 1 rep', () => {
      expect(lander1RM(100, 1)).toBe(100);
    });

    it('calculates correctly for multiple reps', () => {
      const expected = Math.round((100 * 100) / (101.3 - 2.67123 * 5));
      expect(lander1RM(100, 5)).toBe(expected);
    });

    it('returns weight when divisor would be <= 0', () => {
      // 101.3 / 2.67123 ≈ 37.9, so reps >= 38 makes divisor <= 0
      expect(lander1RM(100, 40)).toBe(100);
    });
  });

  describe('calculate1RM', () => {
    it('returns weight for 1 rep', () => {
      expect(calculate1RM(100, 1)).toBe(100);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculate1RM(0, 5)).toBe(0);
      expect(calculate1RM(100, 0)).toBe(0);
      expect(calculate1RM(-10, 5)).toBe(0);
    });

    it('averages all three formulas', () => {
      const e = epley1RM(100, 5);
      const b = brzycki1RM(100, 5);
      const l = lander1RM(100, 5);
      expect(calculate1RM(100, 5)).toBe(Math.round((e + b + l) / 3));
    });
  });
});

describe('Percentage Calculations', () => {
  it('calculates weight at percentage', () => {
    expect(weightAtPercentage(100, 80)).toBe(80);
    expect(weightAtPercentage(200, 75)).toBe(150);
    expect(weightAtPercentage(100, 100)).toBe(100);
  });

  it('generates full percentage breakdown', () => {
    const breakdown = getPercentageBreakdown(100);
    expect(breakdown).toHaveLength(9);
    expect(breakdown[0]).toEqual({ percentage: 100, weight: 100, reps: 1 });
    expect(breakdown[breakdown.length - 1]).toEqual({ percentage: 60, weight: 60, reps: 20 });
  });
});

describe('Plate Calculator', () => {
  it('returns empty plates when target equals barbell weight', () => {
    const result = calculatePlates(20);
    expect(result.plates).toEqual([]);
    expect(result.achievedWeight).toBe(20);
    expect(result.isExact).toBe(true);
  });

  it('returns empty plates when target is less than barbell', () => {
    const result = calculatePlates(10);
    expect(result.plates).toEqual([]);
    expect(result.isExact).toBe(false);
  });

  it('calculates plates for a standard weight', () => {
    // 100kg: barbell (20) + 40 per side. Greedy: 25 + 15 = 40 per side
    const result = calculatePlates(100);
    expect(result.achievedWeight).toBe(100);
    expect(result.isExact).toBe(true);
    expect(result.plates).toEqual([
      { weight: 25, count: 1 },
      { weight: 15, count: 1 },
    ]);
  });

  it('calculates plates for a complex weight', () => {
    // 62.5kg: barbell (20) + 21.25 per side = 20 + 1.25
    const result = calculatePlates(62.5);
    expect(result.achievedWeight).toBe(62.5);
    expect(result.isExact).toBe(true);
  });

  it('uses custom barbell weight', () => {
    const result = calculatePlates(30, 10);
    // 10 per side
    expect(result.barbellWeight).toBe(10);
    expect(result.achievedWeight).toBe(30);
  });
});

describe('Volume Calculations', () => {
  it('calculates single set volume', () => {
    expect(calculateVolume(100, 10)).toBe(1000);
    expect(calculateVolume(50, 8, 3)).toBe(1200);
  });

  it('calculates total volume from sets', () => {
    const sets = [
      { weight: 100, reps: 10 },
      { weight: 100, reps: 8 },
      { weight: 80, reps: 12 },
    ];
    expect(calculateTotalVolume(sets)).toBe(100 * 10 + 100 * 8 + 80 * 12);
  });

  it('handles null/undefined values in sets', () => {
    const sets = [
      { weight: 100, reps: 10 },
      { weight: null, reps: 8 },
      { weight: 80, reps: null },
    ];
    expect(calculateTotalVolume(sets)).toBe(1000);
  });
});

describe('Rest Time Recommendations', () => {
  it('returns correct rest for compound exercises', () => {
    expect(getRecommendedRestTime('compound', 'heavy')).toBe(180);
    expect(getRecommendedRestTime('compound', 'moderate')).toBe(120);
    expect(getRecommendedRestTime('compound', 'light')).toBe(90);
  });

  it('returns correct rest for isolation exercises', () => {
    expect(getRecommendedRestTime('isolation', 'heavy')).toBe(90);
    expect(getRecommendedRestTime('isolation', 'moderate')).toBe(60);
  });

  it('defaults to moderate', () => {
    expect(getRecommendedRestTime('compound')).toBe(120);
  });
});

describe('Intensity Classification', () => {
  it('classifies heavy (>= 85%)', () => {
    expect(getIntensity(90, 100)).toBe('heavy');
    expect(getIntensity(85, 100)).toBe('heavy');
  });

  it('classifies moderate (70-84%)', () => {
    expect(getIntensity(75, 100)).toBe('moderate');
    expect(getIntensity(70, 100)).toBe('moderate');
  });

  it('classifies light (< 70%)', () => {
    expect(getIntensity(60, 100)).toBe('light');
  });

  it('returns moderate for invalid 1RM', () => {
    expect(getIntensity(100, 0)).toBe('moderate');
    expect(getIntensity(100, -10)).toBe('moderate');
  });
});

describe('Exercise Type Classification', () => {
  it('identifies compound exercises', () => {
    expect(getExerciseType('Bench Press')).toBe('compound');
    expect(getExerciseType('Squats')).toBe('compound');
    expect(getExerciseType('Deadlift')).toBe('compound');
    expect(getExerciseType('Pull-ups')).toBe('compound');
  });

  it('identifies core exercises', () => {
    expect(getExerciseType('Plank')).toBe('core');
    expect(getExerciseType('Crunches')).toBe('core');
  });

  it('identifies cardio exercises', () => {
    expect(getExerciseType('Running')).toBe('cardio');
    expect(getExerciseType('Burpees')).toBe('cardio');
  });

  it('defaults to isolation for unknown exercises', () => {
    expect(getExerciseType('Bicep Curl')).toBe('isolation');
    expect(getExerciseType('Lateral Raise')).toBe('isolation');
  });
});
