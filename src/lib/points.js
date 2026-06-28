// NRCan CAN/CGSB-48.9712-2022 Structured Credit System (SCS) — correct rates

export const TAB_CONFIG = {
  field_work: {
    label: "Field Work",
    description: "NDT activities performed on the job",
    color: "blue",
    maxPoints: 95,
    pointsRule: "2 pts per day worked, max 95 pts over 5 years",
    partA: true,
  },
  training_received: {
    label: "Training Received",
    description: "Theoretical and practical courses attended",
    color: "green",
    // sub-limits: theoretical max 15, practical max 25 — combined max 40
    maxPoints: 40,
    pointsRule: "Theoretical: 1 pt/day (max 15) · Practical: 2 pts/day (max 25)",
    partA: true,
    subLimits: {
      theoretical: { rate: 1, max: 15 },
      practical: { rate: 2, max: 25 },
    },
  },
  training_delivered: {
    label: "Training Delivered",
    description: "NDT training you taught or instructed",
    color: "purple",
    maxPoints: 75,
    pointsRule: "1 pt per day delivered, max 75 pts",
    partA: true,
  },
  research: {
    label: "Research",
    description: "NDT research, papers, or engineering studies",
    color: "orange",
    maxPoints: 60,
    pointsRule: "1 pt per week of research, max 60 pts",
    partA: true,
  },
  seminars: {
    label: "Seminars / Conferences",
    description: "Attended sessions or delivered presentations",
    color: "cyan",
    maxPoints: 15, // 10 for attending, 15 if presenting
    pointsRule: "1 pt per day attended (max 10) · 3 pts per presentation (max 15)",
    partA: false,
  },
  professional: {
    label: "Professional Activities",
    description: "Society memberships, committee work",
    color: "yellow",
    maxPoints: 5,
    pointsRule: "1 pt per membership per year, max 5 pts",
    partA: false,
  },
  mentoring: {
    label: "Mentoring",
    description: "Supervising or mentoring NDT trainees",
    color: "pink",
    maxPoints: 30,
    pointsRule: "2 pts per mentee, max 30 pts",
    partA: false,
  },
};

// Total target: 100 pts. Minimum 50 must come from Part A (field_work + training_received + training_delivered + research)
export const TOTAL_TARGET = 100;
export const PART_A_TARGET = 50; // minimum from Part A categories
export const CORE_TABS_TARGET = 50; // alias kept for backward compat

export function calculatePoints(logType, entry) {
  switch (logType) {
    case 'field_work':
      // 2 pts per day; entry.hours / 8 = days
      return Math.round((entry.hours || 0) / 8) * 2;

    case 'training_received': {
      const type = entry.training_type || 'theoretical';
      const days = Math.round((entry.hours || 0) / 8) || 1;
      if (type === 'practical') return days * 2;
      if (type === 'both') return days * 2; // practical rate for combined
      return days * 1; // theoretical
    }

    case 'training_delivered':
      // 1 pt per day
      return Math.max(1, Math.round((entry.hours || 0) / 8));

    case 'research':
      // 1 pt per week; entry.hours / 40 = weeks
      return Math.max(1, Math.round((entry.hours || 0) / 40));

    case 'seminars':
      return entry.role === 'presenter' ? 3 : 1;

    case 'professional':
      // 1 pt per membership per year
      return 1;

    case 'mentoring':
      // 2 pts per mentee
      return (entry.students_count || 1) * 2;

    default:
      return 0;
  }
}

// Cap points for a category at its defined maximum
export function cappedPoints(logType, rawPoints) {
  const max = TAB_CONFIG[logType]?.maxPoints;
  if (max == null) return rawPoints;
  return Math.min(rawPoints, max);
}

export function computeTotals(logs) {
  const byType = {};
  Object.keys(TAB_CONFIG).forEach(t => { byType[t] = 0; });

  logs.forEach(l => {
    if (byType[l.log_type] !== undefined) {
      byType[l.log_type] += (l.points || 0);
    }
  });

  // Apply per-category caps
  Object.keys(byType).forEach(t => {
    byType[t] = cappedPoints(t, byType[t]);
  });

  const partA = (byType.field_work || 0) + (byType.training_received || 0) +
    (byType.training_delivered || 0) + (byType.research || 0);
  const coreTabs = partA; // backward compat alias
  const total = Object.values(byType).reduce((a, b) => a + b, 0);

  return { byType, total, partA, coreTabs };
}