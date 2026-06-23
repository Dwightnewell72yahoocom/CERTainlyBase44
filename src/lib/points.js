// NRCan CAN/CGSB-48.9712-2022 point rates

export const TAB_CONFIG = {
  field_work: {
    label: "Field Work",
    description: "NDT activities performed",
    color: "blue",
    maxPoints: 40,
    pointsRule: "1 pt per 40 hrs"
  },
  training_received: {
    label: "Training Received",
    description: "Theoretical and practical courses",
    color: "green",
    maxPoints: 20,
    pointsRule: "1 pt per hour"
  },
  training_delivered: {
    label: "Training Delivered",
    description: "Training you taught",
    color: "purple",
    maxPoints: 20,
    pointsRule: "2 pts per hour"
  },
  research: {
    label: "Research",
    description: "NDT research and engineering work",
    color: "orange",
    maxPoints: 20,
    pointsRule: "5 pts per project"
  },
  seminars: {
    label: "Seminars",
    description: "Attended or presented",
    color: "cyan",
    maxPoints: 10,
    pointsRule: "1 pt attended / 3 pts presented"
  },
  professional: {
    label: "Professional",
    description: "Society memberships & committee work",
    color: "yellow",
    maxPoints: 10,
    pointsRule: "2 pts per membership/year"
  },
  mentoring: {
    label: "Mentoring",
    description: "Oversight of NDT personnel",
    color: "pink",
    maxPoints: 10,
    pointsRule: "1 pt per 10 hrs"
  }
};

export const TOTAL_TARGET = 100;
export const CORE_TABS_TARGET = 50; // tabs 1-4 must contribute ≥50

export function calculatePoints(logType, entry) {
  switch (logType) {
    case 'field_work':
      return Math.max(1, Math.floor((entry.hours || 0) / 40));
    case 'training_received':
      return Math.round(entry.hours || 0);
    case 'training_delivered':
      return Math.round((entry.hours || 0) * 2);
    case 'research':
      return 5;
    case 'seminars':
      return entry.role === 'presented' ? 3 : 1;
    case 'professional':
      return 2;
    case 'mentoring':
      return Math.max(1, Math.floor((entry.hours || 0) / 10));
    default:
      return 0;
  }
}

export function computeTotals(logs) {
  const byType = {};
  Object.keys(TAB_CONFIG).forEach(t => { byType[t] = 0; });
  logs.forEach(l => {
    if (byType[l.log_type] !== undefined) byType[l.log_type] += (l.points || 0);
  });
  const coreTabs = (byType.field_work || 0) + (byType.training_received || 0) +
    (byType.training_delivered || 0) + (byType.research || 0);
  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  return { byType, total, coreTabs };
}