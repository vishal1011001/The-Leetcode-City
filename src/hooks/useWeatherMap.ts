import { useEffect, useState } from "react";
import useSWR from "swr";
import { mapWeatherCodeToMood, type WeatherMood } from "@/lib/atmosphere";
import { fetchWeatherByCoords } from "@/services/weatherService";

interface WeatherApiResponse {
  fallback?: boolean;
  weather?: Array<{
    id?: number;
    main?: string;
    description?: string;
  }>;
}

function getInitialGeoError() {
  if (typeof navigator === "undefined") return null;

  return "geolocation" in navigator
    ? null
    : "Geolocation is not supported by your browser";
}

export function useWeatherMap() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [geoError, setGeoError] = useState<string | null>(getInitialGeoError);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      }
    );
  }, []);

  const { data, error, isLoading } = useSWR<WeatherApiResponse>(
    coords ? ["weather", coords.lat, coords.lon] : null,
    () => fetchWeatherByCoords(coords!.lat, coords!.lon),
    {
      refreshInterval: 600000,
      shouldRetryOnError: false,
    }
  );

  const weatherCode = data?.weather?.[0]?.id;
  const weatherMain = data?.fallback
    ? "Fallback"
    : data?.weather?.[0]?.main ?? "Fallback";

  const weatherMood: WeatherMood =
    geoError || error || data?.fallback
      ? "fallback"
      : mapWeatherCodeToMood(weatherCode);

  const isRaining = weatherMood === "rain" || weatherMood === "thunderstorm";

  const errorMessage = geoError
    ? geoError
    : error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null;

  return {
    isRaining,
    weatherMood,
    weatherCode,
    weatherMain,
    data,
    isLoading: Boolean(coords) && isLoading,
    error: errorMessage,
  };
}