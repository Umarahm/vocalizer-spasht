export interface Level {
  id: number;
  level: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'basic' | 'intermediate' | 'advanced' | 'boss';
  prompt: string;
  isBossLevel: boolean;
  backgroundImage: string;
  speechBubbleText: string;
  rewardCoins: number;
  rewardXP: number;
  timeLimit?: number; // in seconds
  description: string;
  skills: string[]; // skills this level develops
  image?: string; // optional image for visual levels (object description, puzzles, etc.)
}

export const levels: Level[] = [
  // Level 1-6: Basic Challenges
  {
    id: 1,
    level: 1,
    name: 'Greetings Master',
    difficulty: 'easy',
    type: 'basic',
    prompt: 'Hello! Good morning everyone. How are you today? Nice to meet you!',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 1: Master everyday greetings! Practice proper intonation and friendly delivery.',
    rewardCoins: 25,
    rewardXP: 50,
    timeLimit: 25,
    description: 'Learn to greet others confidently with proper intonation. Practice common phrases like "Hello!", "Good morning!", and "Nice to meet you!" with warmth and clarity.',
    skills: ['Intonation', 'Social Communication', 'Confidence', 'Greeting Etiquette']
  },
  {
    id: 2,
    level: 2,
    name: 'Number Master',
    difficulty: 'easy',
    type: 'basic',
    prompt: 'Say clearly: Phone number 555-0123, Price $24.99, Date September 27th, 2025, Time 3:45 PM',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'LEVEL 2: Master numbers! Practice clear pronunciation of phone numbers, prices, dates, and times.',
    rewardCoins: 30,
    rewardXP: 55,
    timeLimit: 20,
    description: 'Practice saying numbers, prices, dates, and times clearly. Focus on distinct digit pronunciation and natural rhythm for real-world communication.',
    skills: ['Number Pronunciation', 'Clarity', 'Practical Communication', 'Digit Articulation']
  },
  {
    id: 3,
    level: 3,
    name: 'Weather Reporter',
    difficulty: 'easy',
    type: 'basic',
    prompt: 'Today will be sunny with temperatures reaching 75 degrees. Tomorrow brings partly cloudy skies and a chance of afternoon showers.',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 3: Become a weather reporter! Deliver forecasts with clear expression and enthusiasm.',
    rewardCoins: 35,
    rewardXP: 65,
    timeLimit: 30,
    description: 'Practice delivering weather reports with expressive intonation. Learn to convey different weather conditions - from sunny enthusiasm to stormy seriousness - with appropriate vocal variety.',
    skills: ['Expressive Delivery', 'Weather Vocabulary', 'Professional Communication', 'Vocal Variety']
  },
  {
    id: 4,
    level: 4,
    name: 'Breathing Techniques',
    difficulty: 'medium',
    type: 'intermediate',
    prompt: 'Take a deep breath, then speak: "I can speak clearly and confidently without running out of breath." Repeat this sentence 3 times smoothly.',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 4: Master breathing! Learn to speak longer sentences without losing breath or clarity.',
    rewardCoins: 40,
    rewardXP: 75,
    timeLimit: 25,
    description: 'Practice proper breathing techniques for sustained speech. Learn to take breaths at natural pauses and maintain consistent volume throughout longer sentences.',
    skills: ['Breath Control', 'Pacing', 'Sustained Speech', 'Breathing Awareness']
  },
  {
    id: 5,
    level: 5,
    name: 'Story Teller',
    difficulty: 'medium',
    type: 'intermediate',
    prompt: 'Once upon a time, in a magical forest, there lived a curious little rabbit named Hopper. Every morning, Hopper would explore new paths and discover hidden treasures. One sunny day, he found something extraordinary...',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'LEVEL 5: Become a storyteller! Read the story beginning and continue with your own creative ending.',
    rewardCoins: 45,
    rewardXP: 85,
    timeLimit: 45,
    description: 'Read story openings with engaging expression, then create and tell your own continuation. Practice narrative pacing and build storytelling confidence.',
    skills: ['Storytelling', 'Creative Continuation', 'Narrative Pacing', 'Imaginative Speech']
  },
  {
    id: 6,
    level: 6,
    name: 'Color Poet',
    difficulty: 'medium',
    type: 'intermediate',
    prompt: 'Describe the color blue: "Blue is the color of a clear summer sky, deep and endless like the ocean depths, cool and calming like a gentle breeze."',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 6: Master descriptive language! Paint vivid pictures with words when describing colors.',
    rewardCoins: 50,
    rewardXP: 90,
    timeLimit: 35,
    description: 'Practice using rich, descriptive language to talk about colors. Learn vocabulary that evokes emotions and creates mental images through expressive speech.',
    skills: ['Descriptive Language', 'Vocabulary Building', 'Creative Expression', 'Sensory Language']
  },
  // Level 7: BOSS LEVEL
  {
    id: 7,
    level: 7,
    name: 'Communication Master',
    difficulty: 'hard',
    type: 'boss',
    prompt: 'Greet someone warmly, give them your phone number (555-9876), describe tomorrow\'s weather forecast with enthusiasm, then tell a short creative story about meeting a friendly dragon.',
    isBossLevel: true,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundCastles.png',
    speechBubbleText: 'BOSS LEVEL 7: The Communication Master awaits! Combine all your skills in this ultimate speaking challenge!',
    rewardCoins: 100,
    rewardXP: 200,
    timeLimit: 75,
    description: 'Master the complete communication challenge! Combine greetings, numbers, weather reporting, and storytelling into one fluid presentation. Prove you can communicate effectively in any situation.',
    skills: ['Integrated Communication', 'Skill Synthesis', 'Confidence Under Pressure', 'Complete Speech Mastery']
  },
  // Level 8-13: Intermediate Challenges
  {
    id: 8,
    level: 8,
    name: 'Quick Reaction',
    difficulty: 'medium',
    type: 'intermediate',
    prompt: 'Say quickly: "Supercalifragilisticexpialidocious"',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 8: Speed and accuracy. React quickly to build confidence!',
    rewardCoins: 45,
    rewardXP: 90,
    timeLimit: 8,
    description: 'Practice rapid word production under time pressure. Say the challenging tongue twister word quickly and clearly to build instant response skills.',
    skills: ['Quick Thinking', 'Rapid Response', 'Confidence Under Pressure', 'Speed Articulation']
  },
  {
    id: 9,
    level: 9,
    name: 'Object Description',
    difficulty: 'medium',
    type: 'intermediate',
    prompt: 'Describe this vintage red telephone: its round rotary dial, shiny brass mouthpiece, coiled cord, and wooden base with gold numbers. Explain how it works and why it was important.',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'LEVEL 9: Descriptive skills. Paint pictures with your words!',
    rewardCoins: 50,
    rewardXP: 100,
    timeLimit: 45,
    description: 'Describe visual objects using rich vocabulary and clear structure. Practice detailed object descriptions that paint vivid mental pictures.',
    skills: ['Descriptive Language', 'Vocabulary', 'Visual Processing', 'Detailed Observation'],
    image: '/images/level-objects/vintage-telephone.webp'
  },
  {
    id: 10,
    level: 10,
    name: 'Story Building',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Continue this story: "Sarah discovered an old brass key in her grandmother\'s attic. As she turned it in her hand, she noticed strange symbols etched into the metal. Suddenly, the room began to spin..." What happens next? Create an exciting adventure involving mystery, magic, and courage.',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 10: Creative narration. Craft compelling stories on the spot.',
    rewardCoins: 55,
    rewardXP: 110,
    timeLimit: 75,
    description: 'Create coherent story continuations with engaging plots, characters, and conflict. Practice spontaneous creative storytelling.',
    skills: ['Creative Thinking', 'Narrative Structure', 'Spontaneous Speech', 'Plot Development']
  },
  {
    id: 11,
    level: 11,
    name: 'Lyric Singing',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Sing with clear rhythm: "Twinkle, twinkle, little star, how I wonder what you are. Up above the world so high, like a diamond in the sky. Twinkle, twinkle, little star, how I wonder what you are."',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 11: Musical expression. Let your voice shine through melody!',
    rewardCoins: 60,
    rewardXP: 120,
    timeLimit: 60,
    description: 'Sing song lyrics with correct rhythm, pronunciation, and musical expression. Combine speech clarity with melodic timing.',
    skills: ['Rhythm', 'Musical Timing', 'Expressive Speech', 'Melodic Pronunciation']
  },
  {
    id: 12,
    level: 12,
    name: 'Puzzle Solving',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Look at this rebus puzzle showing "painless" (represented by "pain" with "less" next to it). Explain what it means and solve 3 more similar puzzles verbally: 1) HEAD + HEELS = ?, 2) MIND over MATTER = ?, 3) SPLIT + SECOND = ?',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'LEVEL 12: Logical thinking. Use words to solve complex problems.',
    rewardCoins: 65,
    rewardXP: 130,
    timeLimit: 90,
    description: 'Solve visual rebus puzzles through verbal explanation. Analyze wordplay, idioms, and visual representations to find logical solutions.',
    skills: ['Analytical Thinking', 'Problem Solving', 'Logical Communication', 'Wordplay Analysis'],
    image: '/images/level-objects/rebus-puzzle.webp'
  },
  {
    id: 13,
    level: 13,
    name: 'Complex Articulation',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Articulate clearly: "The sixth sick sheik\'s sixth sheep\'s sick." Then say: "Red leather, yellow leather." Finally: "She sells seashells by the seashore."',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 13: Sound mastery. Conquer the toughest articulations!',
    rewardCoins: 70,
    rewardXP: 140,
    timeLimit: 45,
    description: 'Master difficult consonant blends and complex sound combinations through challenging tongue twisters. Perfect your speech precision.',
    skills: ['Advanced Articulation', 'Sound Combinations', 'Speech Precision', 'Tongue Coordination']
  },
  // Level 14: BOSS LEVEL
  {
    id: 14,
    level: 14,
    name: 'Interview Master',
    difficulty: 'hard',
    type: 'boss',
    prompt: 'Choose your interview type and job role, then conduct a professional mock interview with Assembly AI. Answer questions confidently and professionally.',
    isBossLevel: true,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundCastles.png',
    speechBubbleText: 'BOSS LEVEL 14: The Interview Master awaits! Prepare for your professional breakthrough!',
    rewardCoins: 200,
    rewardXP: 400,
    timeLimit: 180,
    description: 'Master the art of professional interviews! Choose your interview type (Technical, Behavioral, Case Study) and job role, then showcase your communication skills in a realistic interview simulation powered by Assembly AI.',
    skills: ['Professional Communication', 'Interview Skills', 'Confidence Under Pressure', 'Industry Knowledge', 'Career Readiness']
  },
  // Level 15-20: Advanced Challenges
  {
    id: 15,
    level: 15,
    name: 'Public Speaking',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Deliver a short speech',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 15: Oratory skills. Command attention with your voice!',
    rewardCoins: 75,
    rewardXP: 150,
    timeLimit: 120,
    description: 'Deliver prepared speeches with confidence and impact. Master the art of public speaking.',
    skills: ['Public Speaking', 'Presentation Skills', 'Audience Engagement']
  },
  {
    id: 16,
    level: 16,
    name: 'Debate Champion',
    difficulty: 'hard',
    type: 'boss',
    prompt: 'Choose a debate topic and argue your position against the AI opponent. The debate will last 3 minutes.',
    isBossLevel: true,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'BOSS LEVEL 16: The Debate Champion awaits! Engage in intellectual combat with AI!',
    rewardCoins: 300,
    rewardXP: 600,
    timeLimit: 180,
    description: 'Master the art of debate! Choose a controversial topic and argue your position against an AI opponent. Points awarded for quality of arguments, speaking time, and fluency. 3-minute intense debate session.',
    skills: ['Debate Mastery', 'Persuasive Communication', 'Critical Thinking', 'Real-time Reasoning', 'Public Speaking Under Pressure']
  },
  {
    id: 17,
    level: 17,
    name: 'Emotional Expression',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Express complex emotions',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 17: Emotional intelligence. Speak from the heart!',
    rewardCoins: 85,
    rewardXP: 170,
    timeLimit: 75,
    description: 'Convey complex emotions through speech with appropriate tone and expression. Develop emotional communication skills.',
    skills: ['Emotional Intelligence', 'Tone Control', 'Expressive Communication']
  },
  {
    id: 18,
    level: 18,
    name: 'Technical Explanation',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Explain a complex concept',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorGrass.png',
    speechBubbleText: 'LEVEL 18: Technical communication. Simplify the complex!',
    rewardCoins: 90,
    rewardXP: 180,
    timeLimit: 105,
    description: 'Explain technical concepts in simple, clear terms. Master the art of making complex ideas accessible.',
    skills: ['Technical Communication', 'Simplification', 'Educational Speaking']
  },
  {
    id: 19,
    level: 19,
    name: 'Storytelling Mastery',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Narrate an engaging story',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorForest.png',
    speechBubbleText: 'LEVEL 19: Narrative excellence. Captivate your audience!',
    rewardCoins: 95,
    rewardXP: 190,
    timeLimit: 135,
    description: 'Tell engaging stories with perfect pacing, vivid descriptions, and emotional impact. Become a master storyteller.',
    skills: ['Storytelling', 'Narrative Pacing', 'Audience Captivation']
  },
  {
    id: 20,
    level: 20,
    name: 'Speed Articulation',
    difficulty: 'hard',
    type: 'advanced',
    prompt: 'Rapid-fire word combinations',
    isBossLevel: false,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundColorFall.png',
    speechBubbleText: 'LEVEL 20: Velocity mastery. Speak faster, clearer, better!',
    rewardCoins: 100,
    rewardXP: 200,
    timeLimit: 45,
    description: 'Master rapid articulation while maintaining clarity. Push the limits of speed and precision.',
    skills: ['Rapid Articulation', 'Speed Control', 'Precision Under Pressure']
  },
  // Level 21: BOSS LEVEL
  {
    id: 21,
    level: 21,
    name: 'Ultimate Speech Boss',
    difficulty: 'hard',
    type: 'boss',
    prompt: 'The final speech challenge awaits!',
    isBossLevel: true,
    backgroundImage: '/kenny-assets/backgrounds/Backgrounds/backgroundCastles.png',
    speechBubbleText: 'BOSS LEVEL 21: The Ultimate Speech Champion! Prove you are the master of eloquence!',
    rewardCoins: 250,
    rewardXP: 500,
    timeLimit: 180,
    description: 'Face the ultimate challenge combining all speech skills. Only the true masters of eloquence can conquer this final boss!',
    skills: ['All Speech Skills', 'Ultimate Mastery', 'Speech Excellence']
  }
];

export const getLevelById = (id: number): Level | undefined => {
  return levels.find(level => level.id === id);
};

export const getLevelsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Level[] => {
  return levels.filter(level => level.difficulty === difficulty);
};

export const getBossLevels = (): Level[] => {
  return levels.filter(level => level.isBossLevel);
};

export const getTotalLevels = (): number => {
  return levels.length;
};

export const getCompletedLevelsCount = (currentLevelId: number): number => {
  return levels.filter(level => level.id < currentLevelId).length;
};
