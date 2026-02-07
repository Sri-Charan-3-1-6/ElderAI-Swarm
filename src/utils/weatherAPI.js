const DEFAULT_COORDS = { lat: 28.6139, lon: 77.2090 };

function getClothingSuggestion(temp, code) {
  if (temp > 35) return 'Very hot! Wear light clothes, drink water, stay indoors if possible.';
  if (temp > 28) return 'Warm day. Wear comfortable clothes. Stay hydrated!';
  if (temp < 15) return 'Cold! Wear warm clothes. Sweater recommended.';
  if (code >= 60) return 'Rain expected. Carry umbrella!';
  return 'Pleasant weather. Perfect for a walk!';
}

function mapCondition(code) {
  if (code >= 80) return 'Rainy';
  if (code >= 70) return 'Windy';
  if (code >= 60) return 'Showers';
  if (code >= 50) return 'Foggy';
  if (code >= 30) return 'Cloudy';
  return 'Clear';
}

export async function getWeather(coords = DEFAULT_COORDS) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    const temp = data?.current_weather?.temperature;
    const code = data?.current_weather?.weathercode ?? 0;
    const condition = mapCondition(code);
    return {
      temperature: Math.round(temp ?? 25),
      condition,
      suggestion: getClothingSuggestion(temp ?? 25, code)
    };
  } catch (error) {
    return {
      temperature: 25,
      condition: 'Pleasant',
      suggestion: 'Enjoy your day!'
    };
  }
}

export { DEFAULT_COORDS };

