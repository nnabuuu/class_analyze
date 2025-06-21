import { AnalysisResult, ClassTask, ConversationEvent, BloomAnalysis, ClassInfo } from '../types';

const mockEvents: ConversationEvent[] = [
  {
    id: 'e1',
    role: 'teacher',
    text: 'Good morning everyone! Today we\'re going to explore the concept of photosynthesis. Can anyone tell me what they already know about how plants make their own food?',
    startTime: 5,
    endTime: 15,
    confidence: 0.95
  },
  {
    id: 'e2',
    role: 'student',
    text: 'Plants use sunlight to make food, right? And they need water too.',
    startTime: 16,
    endTime: 22,
    confidence: 0.88
  },
  {
    id: 'e3',
    role: 'teacher', 
    text: 'Excellent! That\'s a great starting point. Yes, plants do use sunlight and water. They also need something from the air. Does anyone know what that might be?',
    startTime: 23,
    endTime: 35,
    confidence: 0.92
  },
  {
    id: 'e4',
    role: 'student',
    text: 'Carbon dioxide! My mom told me that plants breathe in carbon dioxide.',
    startTime: 36,
    endTime: 42,
    confidence: 0.90
  }
];

const mockEvents2: ConversationEvent[] = [
  {
    id: 'e5',
    role: 'teacher',
    text: 'Now let\'s look at this diagram of a leaf. I want you to identify the different parts and think about their functions. Work in pairs for the next 5 minutes.',
    startTime: 65,
    endTime: 78,
    confidence: 0.94
  },
  {
    id: 'e6',
    role: 'student',
    text: 'This green part must be important for catching sunlight.',
    startTime: 85,
    endTime: 90,
    confidence: 0.87
  },
  {
    id: 'e7',
    role: 'student',
    text: 'And these tiny holes on the bottom - are these where the carbon dioxide goes in?',
    startTime: 91,
    endTime: 98,
    confidence: 0.89
  }
];

const mockEvents3: ConversationEvent[] = [
  {
    id: 'e8',
    role: 'teacher',
    text: 'Fantastic observations! Now I want you to create your own diagram showing the photosynthesis process. Include all the inputs and outputs we\'ve discussed.',
    startTime: 125,
    endTime: 138,
    confidence: 0.96
  },
  {
    id: 'e9',
    role: 'student',
    text: 'Should we include the chemical equation too?',
    startTime: 140,
    endTime: 144,
    confidence: 0.85
  },
  {
    id: 'e10',
    role: 'teacher',
    text: 'Great question! Yes, if you can remember it from our previous lesson, please include it. This will help connect what we learned before with today\'s visual understanding.',
    startTime: 145,
    endTime: 158,
    confidence: 0.93
  }
];

const mockBloomAnalysis: BloomAnalysis[] = [
  {
    level: 'Remember',
    confidence: 0.88,
    description: 'Students recall basic facts about photosynthesis components',
    keywords: ['sunlight', 'water', 'carbon dioxide', 'recall']
  },
  {
    level: 'Understand', 
    confidence: 0.92,
    description: 'Students demonstrate comprehension of leaf structure and function',
    keywords: ['identify', 'explain', 'function', 'structure']
  },
  {
    level: 'Create',
    confidence: 0.85,
    description: 'Students synthesize knowledge to create original diagrams',
    keywords: ['create', 'design', 'synthesize', 'original']
  }
];

const mockClassInfo: ClassInfo = {
  subject: 'Biology',
  level: 'Middle School (Grade 7)',
  knowledgePoints: [
    'Photosynthesis Process',
    'Plant Cell Structure',
    'Light Energy Conversion',
    'Chemical Reactions in Plants',
    'Ecosystem Energy Flow'
  ],
  teachingObjectives: [
    'Understand the basic process of photosynthesis',
    'Identify key components needed for photosynthesis',
    'Explain the relationship between plant structure and function',
    'Apply knowledge to create visual representations'
  ],
  curriculum: 'National Science Standards - Life Science',
  confidence: 0.91
};

const mockTasks: ClassTask[] = [
  {
    id: 't1',
    name: 'Introduction & Prior Knowledge',
    description: 'Opening discussion about photosynthesis basics',
    startTime: 0,
    endTime: 60,
    events: mockEvents,
    bloomAnalysis: mockBloomAnalysis[0]
  },
  {
    id: 't2', 
    name: 'Leaf Structure Analysis',
    description: 'Examining leaf diagrams and identifying parts',
    startTime: 60,
    endTime: 120,
    events: mockEvents2,
    bloomAnalysis: mockBloomAnalysis[1]
  },
  {
    id: 't3',
    name: 'Creative Synthesis',
    description: 'Students create their own photosynthesis diagrams',
    startTime: 120,
    endTime: 180,
    events: mockEvents3,
    bloomAnalysis: mockBloomAnalysis[2]
  }
];

export const mockAnalysisResult: AnalysisResult = {
  id: 'analysis-1',
  title: 'Biology Class - Photosynthesis Lesson',
  duration: 300,
  classInfo: mockClassInfo,
  tasks: mockTasks,
  deepAnalysis: {
    bloom: true,
    sentiment: true,
    engagement: true,
    participation: true
  }
};