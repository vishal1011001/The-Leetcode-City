"use client";

import React, { createContext, useContext, useState } from "react";
import { useWeatherMap } from "@/hooks/useWeatherMap";
import type { WeatherMood } from "@/lib/atmosphere";

interface WeatherContextType {
  isRaining: boolean;
  setIsRaining: (raining: boolean) => void;
  weatherMood: WeatherMood;
  setWeatherMood: (mood: WeatherMood) => void;
  weatherCode?: number;
  setWeatherCode: (code?: number) => void;
  weatherMain?: string;
  setWeatherMain: (main?: string) => void;
  isLoading: boolean;
  error: string | null;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const {
    isRaining: apiIsRaining,
    weatherMood: apiWeatherMood,
    weatherCode: apiWeatherCode,
    weatherMain: apiWeatherMain,
    isLoading,
    error,
  } = useWeatherMap();

  const [manualIsRaining, setManualIsRaining] = useState<boolean | null>(null);
  const [manualWeatherMood, setManualWeatherMood] =
    useState<WeatherMood | null>(null);
  const [manualWeatherCode, setManualWeatherCode] = useState<
    number | undefined
  >();
  const [manualWeatherMain, setManualWeatherMain] = useState<
    string | undefined
  >();

  return (
    <WeatherContext.Provider
      value={{
        isRaining: manualIsRaining ?? apiIsRaining,
        setIsRaining: setManualIsRaining,
        weatherMood: manualWeatherMood ?? apiWeatherMood,
        setWeatherMood: setManualWeatherMood,
        weatherCode: manualWeatherCode ?? apiWeatherCode,
        setWeatherCode: setManualWeatherCode,
        weatherMain: manualWeatherMain ?? apiWeatherMain,
        setWeatherMain: setManualWeatherMain,
        isLoading,
        error,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);

  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }

  return context;
}