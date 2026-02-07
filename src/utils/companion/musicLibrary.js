// ============================================
// MUSIC LIBRARY
// YouTube embeds for different moods
// ============================================

export const MUSIC_LIBRARY = {
  // Old Hindi Classics
  old_hindi: [
    {
      id: 1,
      title: 'Kishore Kumar Golden Hits',
      artist: 'Kishore Kumar',
      url: 'https://www.youtube.com/embed/RiZ-_PQ6nUU',
      duration: '1hr',
      mood: 'nostalgic'
    },
    {
      id: 2,
      title: 'Lata Mangeshkar Best Songs',
      artist: 'Lata Mangeshkar',
      url: 'https://www.youtube.com/embed/yGdBGk7BXxAHk',
      duration: '2hr',
      mood: 'romantic'
    },
    {
      id: 3,
      title: 'Mohammed Rafi Evergreen',
      artist: 'Mohammed Rafi',
      url: 'https://www.youtube.com/embed/k7MU6PXxAHk',
      duration: '1.5hr',
      mood: 'soulful'
    },
    {
      id: 4,
      title: 'Mukesh Timeless Classics',
      artist: 'Mukesh',
      url: 'https://www.youtube.com/embed/vvWrYnZp8EY',
      duration: '1hr',
      mood: 'emotional'
    }
  ],

  // Devotional Music
  devotional: [
    {
      id: 5,
      title: 'Om Namah Shivaya',
      artist: 'Sacred Chants',
      url: 'https://www.youtube.com/embed/5U8zB4AtzxA',
      duration: '30min',
      mood: 'peaceful'
    },
    {
      id: 6,
      title: 'Hanuman Chalisa',
      artist: 'MS Subbulakshmi',
      url: 'https://www.youtube.com/embed/8D-lmqOq0SU',
      duration: '15min',
      mood: 'devotional'
    },
    {
      id: 7,
      title: 'Vishnu Sahasranamam',
      artist: 'MS Subbulakshmi',
      url: 'https://www.youtube.com/embed/XfTe6I7UXOE',
      duration: '45min',
      mood: 'spiritual'
    },
    {
      id: 8,
      title: 'Gayatri Mantra',
      artist: 'Anuradha Paudwal',
      url: 'https://www.youtube.com/embed/qA6UnXmQx5g',
      duration: '20min',
      mood: 'meditative'
    }
  ],

  // Calm/Relaxing
  calm: [
    {
      id: 9,
      title: 'Flute Meditation Music',
      artist: 'Hariprasad Chaurasia',
      url: 'https://www.youtube.com/embed/eP3HK4A_Gjw',
      duration: '1hr',
      mood: 'relaxing'
    },
    {
      id: 10,
      title: 'Sitar Peaceful Instrumental',
      artist: 'Ravi Shankar',
      url: 'https://www.youtube.com/embed/cT3hCMbK3cA',
      duration: '45min',
      mood: 'calm'
    }
  ],

  // Happy/Upbeat
  happy: [
    {
      id: 11,
      title: 'Happy Bollywood Songs',
      artist: 'Various',
      url: 'https://www.youtube.com/embed/X_jGsW9VHVU',
      duration: '1hr',
      mood: 'cheerful'
    }
  ]
};

// Get music by type
export const getMusicByType = (type = 'old_hindi') => {
  const playlist = MUSIC_LIBRARY[type] || MUSIC_LIBRARY.old_hindi;
  return playlist[Math.floor(Math.random() * playlist.length)];
};

// Get all music of a type
export const getAllMusicByType = (type) => {
  return MUSIC_LIBRARY[type] || MUSIC_LIBRARY.old_hindi;
};
