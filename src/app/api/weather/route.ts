import { NextResponse } from "next/server";

const fallbackWeather = {
  fallback: true,
  weather: [
    {
      id: 800,
      main: "Clear",
      description: "fallback clear sky",
    },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing coordinates", ...fallbackWeather },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackWeather);
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      {
        next: {
          revalidate: 600,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(fallbackWeather);
    }

    const data = await res.json();

    return NextResponse.json({
      ...data,
      fallback: false,
    });
  } catch {
    return NextResponse.json(fallbackWeather);
  }
}