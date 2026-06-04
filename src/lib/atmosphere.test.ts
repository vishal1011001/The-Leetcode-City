import { describe, expect, it } from "vitest";
import {
  getAtmosphereVisualState,
  getTimePhase,
  isTimePhase,
  isWeatherMood,
  mapWeatherCodeToMood,
} from "./atmosphere";

describe("mapWeatherCodeToMood", () => {
  it("maps thunderstorm codes", () => {
    expect(mapWeatherCodeToMood(201)).toBe("thunderstorm");
  });

  it("maps rain codes", () => {
    expect(mapWeatherCodeToMood(501)).toBe("rain");
  });

  it("maps snow codes", () => {
    expect(mapWeatherCodeToMood(601)).toBe("snow");
  });

  it("maps mist codes", () => {
    expect(mapWeatherCodeToMood(701)).toBe("mist");
  });

  it("maps clear sky", () => {
    expect(mapWeatherCodeToMood(800)).toBe("clear");
  });

  it("maps cloudy codes", () => {
    expect(mapWeatherCodeToMood(802)).toBe("clouds");
  });

  it("falls back for unknown or missing codes", () => {
    expect(mapWeatherCodeToMood()).toBe("fallback");
    expect(mapWeatherCodeToMood(999)).toBe("fallback");
  });
});

describe("getTimePhase", () => {
  it("detects dawn", () => {
    expect(getTimePhase(new Date("2026-06-05T06:00:00"))).toBe("dawn");
  });

  it("detects day", () => {
    expect(getTimePhase(new Date("2026-06-05T12:00:00"))).toBe("day");
  });

  it("detects sunset", () => {
    expect(getTimePhase(new Date("2026-06-05T18:15:00"))).toBe("sunset");
  });

  it("detects twilight", () => {
    expect(getTimePhase(new Date("2026-06-05T20:00:00"))).toBe("twilight");
  });

  it("detects night", () => {
    expect(getTimePhase(new Date("2026-06-05T23:00:00"))).toBe("night");
  });
});

describe("demo query guards", () => {
  it("accepts only supported time phases", () => {
    expect(isTimePhase("sunset")).toBe(true);
    expect(isTimePhase("invalid")).toBe(false);
  });

  it("accepts only supported weather moods", () => {
    expect(isWeatherMood("rain")).toBe(true);
    expect(isWeatherMood("stormy")).toBe(false);
  });
});

describe("getAtmosphereVisualState", () => {
  it("keeps sunset visually warm", () => {
    const state = getAtmosphereVisualState("sunset", "clear");

    expect(state.skyStops).toContain("#ff8c3d");
    expect(state.starOpacity).toBeGreaterThan(0);
    expect(state.sunPosition[1]).toBeLessThan(25);
  });

  it("applies rainy mood as an overlay", () => {
    const state = getAtmosphereVisualState("sunset", "rain");

    expect(state.weatherMood).toBe("rain");
    expect(state.cloudOpacity).toBeGreaterThan(0.9);
    expect(state.sunIntensity).toBeLessThan(1.15);
  });
});