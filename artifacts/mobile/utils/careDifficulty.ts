export type DifficultyLevel = "Easy" | "Moderate" | "Demanding";

export interface CareDifficultyResult {
  score: number;
  level: DifficultyLevel;
  color: string;
  bgColor: string;
  icon: string;
  breakdown: { label: string; points: number; note: string }[];
}

export function getCareDifficulty(plant: {
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  toxicityToHumans?: string;
  toxicityToPets?: string;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
}): CareDifficultyResult {
  const breakdown: { label: string; points: number; note: string }[] = [];
  let total = 0;

  // Watering: shorter interval = harder
  let waterPoints = 0;
  if (plant.wateringIntervalDays <= 2) waterPoints = 3;
  else if (plant.wateringIntervalDays <= 5) waterPoints = 2;
  else if (plant.wateringIntervalDays <= 10) waterPoints = 1;
  else waterPoints = 0;
  const waterNote =
    plant.wateringIntervalDays <= 2
      ? "Daily watering required"
      : plant.wateringIntervalDays <= 5
      ? "Water every few days"
      : plant.wateringIntervalDays <= 10
      ? "Weekly watering"
      : "Infrequent watering";
  breakdown.push({ label: "Watering", points: waterPoints, note: waterNote });
  total += waterPoints;

  // Fertilizing: shorter interval = harder
  let fertPoints = 0;
  if (plant.fertilizingIntervalDays <= 7) fertPoints = 2;
  else if (plant.fertilizingIntervalDays <= 21) fertPoints = 1;
  else fertPoints = 0;
  const fertNote =
    plant.fertilizingIntervalDays <= 7
      ? "Weekly fertilizing"
      : plant.fertilizingIntervalDays <= 21
      ? "Bi-weekly fertilizing"
      : "Monthly or less";
  breakdown.push({ label: "Fertilizing", points: fertPoints, note: fertNote });
  total += fertPoints;

  // Sunlight
  let sunPoints = 0;
  const sunLower = (plant.sunlight ?? "").toLowerCase();
  if (sunLower.includes("full sun")) sunPoints = 2;
  else if (sunLower.includes("partial")) sunPoints = 1;
  else if (sunLower.includes("shade") || sunLower.includes("low")) sunPoints = 0;
  else sunPoints = 1;
  const sunNote =
    sunPoints === 2
      ? "Needs strong direct sunlight"
      : sunPoints === 1
      ? "Indirect or partial light"
      : "Thrives in low light";
  breakdown.push({ label: "Light Needs", points: sunPoints, note: sunNote });
  total += sunPoints;

  // Humidity
  let humPoints = 0;
  const humLower = (plant.humidity ?? "").toLowerCase();
  if (humLower.includes("high") || humLower.includes("humid")) humPoints = 2;
  else if (humLower.includes("medium") || humLower.includes("moderate")) humPoints = 1;
  else humPoints = 0;
  const humNote =
    humPoints === 2
      ? "High humidity required"
      : humPoints === 1
      ? "Average household humidity"
      : "Tolerates dry air";
  breakdown.push({ label: "Humidity", points: humPoints, note: humNote });
  total += humPoints;

  // Toxicity: toxic plants require more caution
  let toxPoints = 0;
  const humansLower = (plant.toxicityToHumans ?? "").toLowerCase();
  const petsLower = (plant.toxicityToPets ?? "").toLowerCase();
  if (humansLower.includes("toxic") || petsLower.includes("toxic")) toxPoints = 1;
  const toxNote =
    toxPoints === 1 ? "Handle with care — toxic" : "Safe for home";
  breakdown.push({ label: "Safety", points: toxPoints, note: toxNote });
  total += toxPoints;

  // Max possible = 3+2+2+2+1 = 10
  const score = Math.min(10, total);

  let level: DifficultyLevel;
  let color: string;
  let bgColor: string;
  let icon: string;

  if (score <= 3) {
    level = "Easy";
    color = "#1F8A4C";
    bgColor = "#E8F5EE";
    icon = "leaf";
  } else if (score <= 6) {
    level = "Moderate";
    color = "#F5A623";
    bgColor = "#FFF8EC";
    icon = "partly-sunny";
  } else {
    level = "Demanding";
    color = "#E53935";
    bgColor = "#FFEBEE";
    icon = "flame";
  }

  return { score, level, color, bgColor, icon, breakdown };
}
