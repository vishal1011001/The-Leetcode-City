export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenWeatherMap API Key");
  }
  
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error("Weather data fetch failed");
  }
  
  return response.json();
};