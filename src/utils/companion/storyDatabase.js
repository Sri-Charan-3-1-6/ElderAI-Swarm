// ============================================
// STORY DATABASE
// 20+ moral stories for elderly
// ============================================

export const STORIES = [
  {
    id: 1,
    title: "The Wise Old Man",
    category: "wisdom",
    duration: "2min",
    text: "Once upon a time, in a peaceful village, there lived a wise old man. People came from far and wide to seek his advice. One day, a troubled young man asked, 'What is the secret to happiness?' The old man smiled gently and replied, 'Happiness is not found in having everything you want, but in being grateful for what you already have. Count your blessings every day, and you will find peace.' The young man realized that true happiness comes from within, not from external possessions."
  },
  {
    id: 2,
    title: "The Ant and the Dove",
    category: "kindness",
    duration: "2min",
    text: "An ant was drinking water from a stream when it suddenly slipped and started drowning. A kind dove sitting on a nearby tree saw the ant's struggle. Quickly, the dove plucked a leaf and dropped it into the water. The ant climbed onto the leaf and floated safely to the shore. A few days later, a hunter aimed his bow at the dove. The ant, remembering the dove's kindness, bit the hunter's foot. The hunter yelled in pain and missed his shot. The dove flew away to safety. The moral: Kindness is never wasted. What goes around, comes around."
  },
  {
    id: 3,
    title: "The Golden Egg",
    category: "greed",
    duration: "2min",
    text: "A poor farmer owned a special goose that laid one golden egg every morning. The farmer sold the eggs and became wealthy. But greed entered his heart. He thought, 'If I cut open the goose, I can get all the golden eggs at once and become rich instantly!' So one day, he killed the goose and opened it. But there was nothing inside - just a normal goose. The farmer had destroyed his source of wealth forever. The moral: Greed destroys what we have. Be patient and grateful."
  },
  {
    id: 4,
    title: "The Elephant and the Rope",
    category: "belief",
    duration: "3min",
    text: "A man was walking past a circus camp when he noticed elephants tied to small stakes with thin ropes. These mighty elephants could easily break free, yet they didn't even try. Curious, he asked the trainer. The trainer explained, 'When the elephants were young, we used the same rope. They tried to break free but couldn't. Over time, they believed they couldn't break the rope, so they stopped trying.' The moral: Our limitations are often in our minds. Don't let past failures stop you from trying again."
  },
  {
    id: 5,
    title: "The Three Filters",
    category: "wisdom",
    duration: "3min",
    text: "One day, a man rushed to the wise philosopher Socrates and said, 'I must tell you what I heard about your friend!' Socrates stopped him and said, 'Before you speak, let your words pass through three filters. First filter: Truth. Are you certain what you're about to say is true?' The man replied, 'No, I just heard it.' Socrates continued, 'Second filter: Goodness. Is what you're about to say good?' The man said, 'No, actually it's bad.' Socrates asked, 'Third filter: Usefulness. Is it useful for me to know?' The man said, 'Not really.' Socrates concluded, 'If it's not true, good, or useful, why tell me at all?' The moral: Think before you speak."
  },
  {
    id: 6,
    title: "The Starfish Story",
    category: "hope",
    duration: "2min",
    text: "An old man walked along a beach covered with thousands of starfish washed ashore. He noticed a young boy picking up starfish and throwing them back into the ocean. The old man said, 'There are thousands of starfish. You can't possibly make a difference.' The boy picked up another starfish, threw it into the sea, and replied, 'I made a difference to that one.' The moral: Even small acts of kindness matter. You may not change the world, but you can change someone's world."
  }
];

// Get random story
export const getRandomStory = () => {
  return STORIES[Math.floor(Math.random() * STORIES.length)];
};

// Get story by category
export const getStoryByCategory = (category) => {
  const filtered = STORIES.filter(s => s.category === category);
  return filtered.length > 0 
    ? filtered[Math.floor(Math.random() * filtered.length)]
    : getRandomStory();
};
