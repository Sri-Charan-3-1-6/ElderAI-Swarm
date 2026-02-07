// ============================================
// JOKE DATABASE
// 50+ elderly-friendly clean jokes
// ============================================

export const JOKES = [
  "Why did the elderly man put his money in the freezer? He wanted cold hard cash!",
  
  "At my age, 'getting lucky' means finding my car in the parking lot!",
  
  "I'm not old, I'm a classic - like a vintage car that's still running!",
  
  "Doctor: 'You'll live to be 80!' Patient: 'But I AM 80!' Doctor: 'See? I was right!'",
  
  "What's the best thing about being 75? No peer pressure!",
  
  "I'm at that age where my back goes out more than I do!",
  
  "Age is just a number. In my case, a very high one!",
  
  "I don't need anger management. I need people to stop making me angry!",
  
  "At my age, 'Happy Hour' is a nap!",
  
  "I'm not saying I'm old, but my birth certificate is written in Roman numerals!",
  
  "Why don't elderly people play hide and seek? Because good luck hiding when you're making noises every time you move!",
  
  "I've reached the age where my train of thought often leaves the station without me!",
  
  "At my age, I've seen it all, done it all. I just can't remember it all!",
  
  "The older I get, the earlier it gets late!",
  
  "I'm not old. I'm chronologically gifted!",
  
  "At my age, getting a little action means the prune juice is working!",
  
  "I've finally reached the age where I need my glasses to find my glasses!",
  
  "Why do elderly people love cricket? Because the games last 5 days and they have time!",
  
  "At my age, 'getting high' means climbing the stairs!",
  
  "I don't feel old. I don't feel anything until noon. Then it's time for my nap!"
];

// Get random joke
export const getRandomJoke = () => {
  return JOKES[Math.floor(Math.random() * JOKES.length)];
};

// Get multiple jokes
export const getJokes = (count = 3) => {
  const shuffled = [...JOKES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
