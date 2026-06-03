"use client";

import { useState, useEffect, useCallback } from "react";

type WeatherMode = "sunny" | "rainy" | "windy" | "stormy" | "snowy";

const STORAGE_KEY = "leetcodecity_weather_mode";
const MODES: WeatherMode[] = ["sunny", "rainy", "windy", "stormy", "snowy"];

function isWeatherMode(v: unknown): v is WeatherMode {
  return typeof v === "string" && (MODES as string[]).includes(v);
}

export function useWeather() {
  // Always initialize with "sunny" to match SSR — localStorage is read after hydration
  const [weatherMode, setWeatherModeState] = useState<WeatherMode>("sunny");
  const [cityName, setCityName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setWeatherMode = useCallback((mode: WeatherMode) => {
    setWeatherModeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, []);

  const refresh = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (isWeatherMode(data.weatherMode)) setWeatherModeState(data.weatherMode);
          if (typeof data.cityName === "string") setCityName(data.cityName);
        } catch {}
        setIsLoading(false);
      },
      () => setIsLoading(false),
      { timeout: 8000 }
    );
  }, []);

  const searchByCity = useCallback(async (city: string) => {
    if (!city.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city.trim())}`);
      const data = await res.json();
      if (isWeatherMode(data.weatherMode)) setWeatherModeState(data.weatherMode);
      if (typeof data.cityName === "string") setCityName(data.cityName);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Read saved preference after hydration to avoid SSR mismatch
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isWeatherMode(saved)) {
        setWeatherModeState(saved);
        return; // user has a saved preference, skip geolocation
      }
    } catch {}
    // First visit: auto-detect from geolocation
    refresh();
  }, [refresh]);

  return { weatherMode, setWeatherMode, cityName, isLoading, refresh, searchByCity };
}
