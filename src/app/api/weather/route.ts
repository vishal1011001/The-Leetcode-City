import { NextResponse } from "next/server";

type WeatherMode = "sunny" | "rainy" | "windy" | "stormy" | "snowy";

function codeToMode(code: number): WeatherMode {
  if (code >= 200 && code <= 299) return "stormy";
  if ((code >= 300 && code <= 399) || (code >= 500 && code <= 531)) return "rainy";
  if (code >= 600 && code <= 622) return "snowy";
  if (code >= 700 && code <= 781) return "windy";
  if (code === 800) return "sunny";
  // 801–804: light to heavy cloud cover
  if (code >= 801 && code <= 802) return "sunny";
  if (code >= 803 && code <= 804) return "windy";
  return "sunny";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ weatherMode: "sunny" as WeatherMode });
  }

  try {
    let url: string;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const city = searchParams.get("city");

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    } else {
      return NextResponse.json({ weatherMode: "sunny" as WeatherMode });
    }

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json({ weatherMode: "sunny" as WeatherMode });
    }

    const data = await res.json();
    const weatherCode: number = data?.weather?.[0]?.id ?? 800;
    const description: string = data?.weather?.[0]?.description ?? "";
    const cityName: string = data?.name ?? "";

    return NextResponse.json({
      weatherMode: codeToMode(weatherCode),
      weatherCode,
      description,
      cityName,
    });
  } catch {
    return NextResponse.json({ weatherMode: "sunny" as WeatherMode });
  }
}
