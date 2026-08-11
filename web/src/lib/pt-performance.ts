export type PerformanceObservation = { metricType: string; value: string | number; unit: string; repetitions: number | null; loadKg: string | number | null };

export function listText(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export function remapSessionDays<T>(byDay: Record<string, T[]>, sourceDays: number[], targetDays: number[]) {
  return Object.fromEntries(targetDays.map((day, index) => [String(day), byDay[String(sourceDays[index])] ?? []]));
}

export function performanceBaselineText(record: PerformanceObservation) {
  const value = Number(record.value);
  const formattedValue = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  if (record.metricType === "rep_max" && record.repetitions && record.loadKg) return `${record.loadKg} kg × ${record.repetitions} rep max`;
  const label = record.metricType === "one_rm" ? "1RM" : record.metricType === "estimated_one_rm" ? "estimated 1RM" : record.metricType;
  return `${formattedValue} ${record.unit} ${label}`;
}

export function defaultEffortForExperience(trainingExperience: string | null | undefined) {
  return /beginner|novice|new to/i.test(trainingExperience ?? "") ? "3 RIR" : "2 RIR";
}
