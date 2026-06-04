export type WeatherMood =
  | "clear"
  | "clouds"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "mist"
  | "fallback";

export type TimePhase =
  | "night"
  | "dawn"
  | "day"
  | "sunset"
  | "twilight";

export interface AtmosphereVisualState {
  phase: TimePhase;
  weatherMood: WeatherMood;
  fogColor: string;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  fillColor: string;
  fillIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  skyStops: string[];
  starOpacity: number;
  cloudColor: string;
  cloudOpacity: number;
  sunPosition: [number, number, number];
}

export function mapWeatherCodeToMood(code?: number): WeatherMood {
  if (!code) return "fallback";

  if (code >= 200 && code < 300) return "thunderstorm";
  if (code >= 300 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return "mist";
  if (code === 800) return "clear";
  if (code > 800 && code < 900) return "clouds";

  return "fallback";
}

export function getTimePhase(date = new Date()): TimePhase {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  const dawnStart = 5 * 60 + 15;
  const dawnEnd = 7 * 60 + 15;

  const sunsetStart = 17 * 60 + 15;
  const sunsetEnd = 19 * 60 + 15;

  const twilightEnd = 20 * 60 + 30;

  if (totalMinutes >= dawnStart && totalMinutes <= dawnEnd) return "dawn";
  if (totalMinutes > dawnEnd && totalMinutes < sunsetStart) return "day";
  if (totalMinutes >= sunsetStart && totalMinutes <= sunsetEnd) return "sunset";
  if (totalMinutes > sunsetEnd && totalMinutes <= twilightEnd) return "twilight";

  return "night";
}

export function isTimePhase(value: string | null): value is TimePhase {
  return (
    value === "night" ||
    value === "dawn" ||
    value === "day" ||
    value === "sunset" ||
    value === "twilight"
  );
}

export function isWeatherMood(value: string | null): value is WeatherMood {
  return (
    value === "clear" ||
    value === "clouds" ||
    value === "rain" ||
    value === "thunderstorm" ||
    value === "snow" ||
    value === "mist" ||
    value === "fallback"
  );
}

export function getAtmosphereVisualState(
  phase: TimePhase,
  weatherMood: WeatherMood
): AtmosphereVisualState {
  const base: Record<TimePhase, AtmosphereVisualState> = {
    night: {
      phase,
      weatherMood,
      fogColor: "#050816",
      ambientColor: "#26345f",
      ambientIntensity: 0.18,
      sunColor: "#6f86c8",
      sunIntensity: 0.18,
      fillColor: "#101936",
      fillIntensity: 0.12,
      hemiSky: "#172554",
      hemiGround: "#020617",
      hemiIntensity: 0.18,
      skyStops: ["#01020a", "#020617", "#0f172a", "#1e1b4b", "#312e81"],
      starOpacity: 0.9,
      cloudColor: "#b7c2e8",
      cloudOpacity: 0.22,
      sunPosition: [-80, -20, -110],
    },
    dawn: {
      phase,
      weatherMood,
      fogColor: "#7c4a55",
      ambientColor: "#f7b58b",
      ambientIntensity: 0.55,
      sunColor: "#ffd08a",
      sunIntensity: 0.95,
      fillColor: "#5c4b8a",
      fillIntensity: 0.32,
      hemiSky: "#9fa8ff",
      hemiGround: "#3f2a2a",
      hemiIntensity: 0.55,
      skyStops: ["#17142f", "#5b6ee1", "#ff9f6e", "#ffc76d", "#ffe3a3"],
      starOpacity: 0.12,
      cloudColor: "#ffc2a0",
      cloudOpacity: 0.55,
      sunPosition: [-70, 18, -120],
    },
    day: {
      phase,
      weatherMood,
      fogColor: "#8cbeff",
      ambientColor: "#ffffff",
      ambientIntensity: 0.86,
      sunColor: "#fff7ce",
      sunIntensity: 1.35,
      fillColor: "#9fc4ff",
      fillIntensity: 0.42,
      hemiSky: "#a0c8ff",
      hemiGround: "#403830",
      hemiIntensity: 0.76,
      skyStops: ["#0f3ca0", "#2f78d8", "#7dbdff", "#b9e5ff", "#eaf8ff"],
      starOpacity: 0,
      cloudColor: "#ffffff",
      cloudOpacity: 0.35,
      sunPosition: [65, 90, -70],
    },
    sunset: {
      phase,
      weatherMood,
      fogColor: "#6b2f4a",
      ambientColor: "#d78a63",
      ambientIntensity: 0.58,
      sunColor: "#ffb347",
      sunIntensity: 1.15,
      fillColor: "#432058",
      fillIntensity: 0.28,
      hemiSky: "#c15f82",
      hemiGround: "#25111e",
      hemiIntensity: 0.56,
      skyStops: ["#12091f", "#2b1858", "#c75a7a", "#ff8c3d", "#ffd08a"],
      starOpacity: 0.28,
      cloudColor: "#ff9f7a",
      cloudOpacity: 0.75,
      sunPosition: [78, 16, -120],
    },
    twilight: {
      phase,
      weatherMood,
      fogColor: "#27143f",
      ambientColor: "#6c5f9f",
      ambientIntensity: 0.34,
      sunColor: "#ff784f",
      sunIntensity: 0.42,
      fillColor: "#1f1748",
      fillIntensity: 0.2,
      hemiSky: "#3b2f72",
      hemiGround: "#080817",
      hemiIntensity: 0.34,
      skyStops: ["#030617", "#0a102f", "#3b1f5a", "#a3445f", "#ff8a4d"],
      starOpacity: 0.68,
      cloudColor: "#d68aa4",
      cloudOpacity: 0.5,
      sunPosition: [88, 3, -120],
    },
  };

  const state = base[phase];

  if (weatherMood === "clouds") {
    return {
      ...state,
      weatherMood,
      cloudOpacity: Math.max(state.cloudOpacity, 0.78),
    };
  }

  if (weatherMood === "rain" || weatherMood === "thunderstorm") {
    return {
      ...state,
      weatherMood,
      fogColor: "#1f2937",
      ambientColor: "#5b6475",
      ambientIntensity: Math.max(0.22, state.ambientIntensity - 0.16),
      sunIntensity: Math.max(0.12, state.sunIntensity - 0.4),
      cloudColor: "#64748b",
      cloudOpacity: 0.92,
      skyStops: ["#0f172a", "#1f2937", "#334155", "#475569", "#64748b"],
    };
  }

  if (weatherMood === "snow" || weatherMood === "mist") {
    return {
      ...state,
      weatherMood,
      fogColor: "#cbd5e1",
      ambientIntensity: Math.min(0.75, state.ambientIntensity + 0.08),
      cloudColor: "#e2e8f0",
      cloudOpacity: 0.85,
    };
  }

  return {
    ...state,
    weatherMood,
  };
}