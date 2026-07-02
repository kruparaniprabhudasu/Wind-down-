// js/quotes.js
// Sleep & rest quotes shown on the Good Night screen

const QUOTES = [
  { text: "Sleep is the golden chain that ties health and our bodies together.", author: "Thomas Dekker" },
  { text: "Each night, when I go to sleep, I die. And the next morning, when I wake up, I am reborn.", author: "Mahatma Gandhi" },
  { text: "Man should forget his anger before he lies down to sleep.", author: "Mahatma Gandhi" },
  { text: "The best bridge between despair and hope is a good night's sleep.", author: "E. Joseph Cossman" },
  { text: "Sleep is the best meditation.", author: "Dalai Lama" },
  { text: "Finish each day before you begin the next, and interpose a solid wall of sleep between the two.", author: "Ralph Waldo Emerson" },
  { text: "A good laugh and a long sleep are the two best cures for anything.", author: "Irish Proverb" },
  { text: "There is a time for many words, and there is also a time for sleep.", author: "Homer" },
  { text: "Even a soul submerged in sleep is hard at work and helps make something of the world.", author: "Heraclitus" },
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston" },
  { text: "Tired minds don't plan well. Sleep first, plan later.", author: "Walter Reisch" },
  { text: "The night is the hardest time to be alive and 4am knows all my secrets.", author: "Poppy Z. Brite" },
  { text: "Let her sleep, for when she wakes, she will move mountains.", author: "Napoleon Bonaparte" },
  { text: "No day is so bad it can't be fixed with a nap.", author: "Carrie Snow" },
  { text: "Your future depends on your dreams, so go to sleep.", author: "Mesut Barazany" },
];

/**
 * Returns a random quote object { text, author }
 */
function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}