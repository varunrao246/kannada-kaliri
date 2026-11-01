/**
 * AI Conversation Simulator — Scenario Library Data
 * Kannada Kaliri — Milestone 07
 *
 * 8 authentic, culturally rooted Karnataka conversational scenarios.
 */

import type { ScenarioDefinition } from './types';

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'local-shop',
    title: 'Shopping at a Local Shop',
    kannadaTitle: 'ಕಿರಾಣಿ ಅಂಗಡಿಯಲ್ಲಿ ವ್ಯಾಪಾರ',
    category: 'daily_life',
    difficulty: 'beginner',
    description:
      'Buy everyday groceries like milk, coffee powder, and sugar from an authentic Bengaluru neighbourhood Kirāṇi store.',
    location: '11th Cross, Malleshwaram, Bengaluru',
    estimatedMinutes: 5,
    targetTurns: 5,
    character: {
      name: 'Manjunath',
      kannadaName: 'ಮಂಜುನಾಥ',
      role: 'Kirāṇi Shopkeeper',
      avatar: '🏪',
      persona:
        'A warm, bustling middle-aged shopkeeper in Malleshwaram who has run his store for 20 years. Appreciates when non-Kannadigas try speaking Kannada and helps them with numbers.',
      tone: 'Warm, direct, encouraging',
      voiceGender: 'male',
    },
    objective:
      'Ask for Nandini milk and sugar, inquire about the total price, and complete the purchase politely using Kannada.',
    culturalContext:
      'In Karnataka, asking with "ಕೊಡಿ" (kodi - polite give) instead of "ಕೊಡು" (kodu) shows respect to shopkeepers.',
    usefulVocabulary: [
      { kannada: 'ಹಾಲು', transliteration: 'Hālu', english: 'Milk' },
      { kannada: 'ಸಕ್ಕರೆ', transliteration: 'Sakkare', english: 'Sugar' },
      { kannada: 'ಎಷ್ಟು ಆಯ್ತು?', transliteration: 'Eshtu aaytu?', english: 'How much did it cost?' },
      { kannada: 'ಕೊಡಿ', transliteration: 'Kodi', english: 'Please give' },
      { kannada: 'ಧನ್ಯವಾದಗಳು', transliteration: 'Dhanyavādagalu', english: 'Thank you' },
    ],
    expectedOutcomes: [
      'Use polite request form "ಕೊಡಿ" (kodi)',
      'Ask total cost using "ಎಷ್ಟು ಆಯ್ತು?"',
      'Understand number prices from 10 to 100',
    ],
    initialMessage: {
      kannadaText: 'ನಮಸ್ಕಾರ ಸ್ವಾಮಿ! ಏನು ಬೇಕಾಗಿತ್ತು ಇಂದು?',
      transliteration: 'Namaskāra swāmi! Ēnu bēkāgittu indu?',
      englishTranslation: 'Hello sir! What do you need today?',
      suggestedReplies: [
        'ಒಂದು ಪ್ಯಾಕೆಟ್ ನಂದಿನಿ ಹಾಲು ಕೊಡಿ (One packet Nandini milk please)',
        'ಅರ್ಧ ಕೆಜಿ ಸಕ್ಕರೆ ಇದೆಯಾ? (Do you have half kg sugar?)',
        'ಒಂದು ಕಾಫಿ ಪುಡಿ ಕೊಡಿ (Give one coffee powder please)',
      ],
    },
  },
  {
    id: 'restaurant-darshini',
    title: 'Ordering at a Darshini',
    kannadaTitle: 'ಹೋಟೆಲ್ / ದರ್ಶಿನಿಯಲ್ಲಿ ತಿಂಡಿ',
    category: 'dining',
    difficulty: 'beginner',
    description:
      'Order a crispy Masala Dosa and strong Filter Coffee at an iconic Bengaluru Darshini restaurant counter.',
    location: 'Vidyarthi Bhavan / CTR, Bengaluru',
    estimatedMinutes: 5,
    targetTurns: 5,
    character: {
      name: 'Ramesh',
      kannadaName: 'ರಮೇಶ್',
      role: 'Darshini Cashier & Server',
      avatar: '☕',
      persona:
        'Fast-moving, loud, friendly darshini cashier who serves hundreds of dosas every morning. Speaks rapid Bengaluru Kannada but softens up and helps learners.',
      tone: 'Energetic, efficient, hospitable',
      voiceGender: 'male',
    },
    objective:
      'Order Masala Dosa and Filter Coffee, ask for less sugar, and ask for the coupon/token bill.',
    culturalContext:
      'Bengaluru darshinis operate on a self-service token system. You order at the counter, get a token, and collect food with sambar and chutney.',
    usefulVocabulary: [
      { kannada: 'ಮಸಾಲ ದೋಸೆ', transliteration: 'Masāla dōse', english: 'Masala Dosa' },
      { kannada: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', transliteration: 'Philtar kāphi', english: 'Filter Coffee' },
      { kannada: 'ಸಕ್ಕರೆ ಕಡಿಮೆ', transliteration: 'Sakkare kaḍime', english: 'Less sugar' },
      { kannada: 'ಬಿಸಿ ನೀರು', transliteration: 'Bisi neeru', english: 'Hot water' },
      { kannada: 'ಟೋಕನ್', transliteration: 'Tōkan', english: 'Token / Receipt' },
    ],
    expectedOutcomes: [
      'Order food items with proper polite quantity phrases',
      'Specify preferences ("ಸಕ್ಕರೆ ಬೇಡ" / "ಸಕ್ಕರೆ ಕಡಿಮೆ")',
      'Complete payment query ("QR code ಇದೆಯಾ?")',
    ],
    initialMessage: {
      kannadaText: 'ಬನ್ನಿ ಬನ್ನಿ! ಏನು ತಿಂಡಿ ಬೇಕು? ಬಿಸಿ ಬಿಸಿ ಮಸಾಲ ದೋಸೆ ರೆಡಿ ಇದೆ!',
      transliteration: 'Banni banni! Ēnu tinḍi bēku? Bisi bisi masāla dōse reḍi ide!',
      englishTranslation: 'Welcome! What snack would you like? Piping hot masala dosa is ready!',
      suggestedReplies: [
        'ಒಂದು ಮಸಾಲ ದೋಸೆ ಮತ್ತು ಒಂದು ಕಾಫಿ ಕೊಡಿ (One masala dosa and one coffee please)',
        'ಕಾಫಿಯಲ್ಲಿ ಸಕ್ಕರೆ ಕಡಿಮೆ ಹಾಕಿ (Put less sugar in coffee)',
        'ಯುಪಿಐ (UPI) ಸ್ಕ್ಯಾನರ್ ಇದೆಯಾ? (Do you have a UPI scanner?)',
      ],
    },
  },
  {
    id: 'college-introduction',
    title: 'Meeting a College Student',
    kannadaTitle: 'ಕಾಲೇಜು ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ಹೊಸ ಪರಿಚಯ',
    category: 'social',
    difficulty: 'beginner',
    description:
      'Introduce yourself to a friendly Kannada student under the trees of a university campus in Mysuru.',
    location: 'Manasagangotri Campus, Mysuru',
    estimatedMinutes: 6,
    targetTurns: 6,
    character: {
      name: 'Ananya',
      kannadaName: 'ಅನನ್ಯ',
      role: 'Engineering Student',
      avatar: '🎓',
      persona:
        'A cheerful, tech-savvy Mysore student who speaks clear, standard Kannada and loves meeting people learning her mother tongue.',
      tone: 'Friendly, youthful, inquisitive',
      voiceGender: 'female',
    },
    objective:
      'Exchange names, share where you are from, mention that you are learning Kannada, and ask about campus life.',
    culturalContext:
      'Peer introductions in Karnataka often blend informal warmth with mutual respect. Asking "ನಿಮ್ಮ ಊರು ಯಾವುದು?" (Which is your native place?) is a very common social icebreaker.',
    usefulVocabulary: [
      { kannada: 'ನನ್ನ ಹೆಸರು...', transliteration: 'Nanna hesaru...', english: 'My name is...' },
      { kannada: 'ನಿಮ್ಮ ಹೆಸರು ಏನು?', transliteration: 'Nimma hesaru ēnu?', english: 'What is your name?' },
      { kannada: 'ನಾನು ಕಲಿಯುತ್ತಿದ್ದೇನೆ', transliteration: 'Nānu kaliyuttiddēne', english: 'I am learning' },
      { kannada: 'ತುಂಬಾ ಸಂತೋಷ', transliteration: 'Tumbā santōsha', english: 'Very glad to meet you' },
      { kannada: 'ಊರು', transliteration: 'Ūru', english: 'Home town / city' },
    ],
    expectedOutcomes: [
      'Confidently introduce oneself using "ನನ್ನ ಹೆಸರು..."',
      'Use "ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ" (I am learning Kannada)',
      'Ask reciprocal questions politely',
    ],
    initialMessage: {
      kannadaText: 'ನಮಸ್ಕಾರ! ನೀವು ಹೊಸಬರಾ ಇಲ್ಲಿಗೆ? ನನ್ನ ಹೆಸರು ಅನನ್ಯ.',
      transliteration: 'Namaskāra! Neevu hosabarā illige? Nanna hesaru Ananya.',
      englishTranslation: 'Hello! Are you new here? My name is Ananya.',
      suggestedReplies: [
        'ನಮಸ್ಕಾರ! ನನ್ನ ಹೆಸರು... ತುಂಬಾ ಸಂತೋಷ! (Hello! My name is... Nice to meet you!)',
        'ಹೌದು, ನಾನು ಹೊಸಬ. ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ. (Yes, I am new. I am learning Kannada.)',
        'ನೀವು ಯಾವ ಕೋರ್ಸ್ ಓದುತ್ತಿದ್ದೀರಿ? (Which course are you studying?)',
      ],
    },
  },
  {
    id: 'asking-directions',
    title: 'Asking for Directions',
    kannadaTitle: 'ದಾರಿ ಕೇಳುವುದು',
    category: 'travel',
    difficulty: 'elementary',
    description:
      'Ask a local resident how to reach the nearest Namma Metro station through busy Bengaluru roads.',
    location: 'Majestic / Kempegowda Bus Station, Bengaluru',
    estimatedMinutes: 6,
    targetTurns: 6,
    character: {
      name: 'Suresh',
      kannadaName: 'ಸುರೇಶ್',
      role: 'Long-time Bengaluru Resident',
      avatar: '🧭',
      persona:
        'A retired teacher who knows every corner of Bengaluru. Speaks patient, well-enunciated Kannada and gives precise directions using landmarks.',
      tone: 'Helpful, courteous, patient',
      voiceGender: 'male',
    },
    objective:
      'Ask for directions to the metro, understand right/left/straight indications, and thank the person politely.',
    culturalContext:
      'Landmark-based navigation ("ಸರ್ಕಲ್ ದಾಟಿ", "ಸಿಗ್ನಲ್ ಹತ್ತಿರ") is the traditional way directions are given across Karnataka cities.',
    usefulVocabulary: [
      { kannada: 'ದಾರಿ ಎಲ್ಲಿದೆ?', transliteration: 'Dāri ellide?', english: 'Where is the way?' },
      { kannada: 'ನೇರವಾಗಿ ಹೋಗಿ', transliteration: 'Nēravāgi hōgi', english: 'Go straight' },
      { kannada: 'ಬಲಕ್ಕೆ ತಿರುಗಿ', transliteration: 'Balakke tirugi', english: 'Turn right' },
      { kannada: 'ಎಡಕ್ಕೆ ತಿರುಗಿ', transliteration: 'Eḍakke tirugi', english: 'Turn left' },
      { kannada: 'ಹತ್ತಿರವೇ ಇದೆಯಾ?', transliteration: 'Hattiravē ideyā?', english: 'Is it nearby?' },
    ],
    expectedOutcomes: [
      'Ask location questions using "ಎಲ್ಲಿದೆ?" (Where is...?)',
      'Comprehend directional commands: "ನೇರವಾಗಿ", "ಬಲಕ್ಕೆ", "ಎಡಕ್ಕೆ"',
      'Confirm distance using "ಎಷ್ಟು ದೂರ?"',
    ],
    initialMessage: {
      kannadaText: 'ನಮಸ್ಕಾರ! ಏನಾದ್ರೂ ಸಹಾಯ ಬೇಕಿತ್ತಾ? ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು?',
      transliteration: 'Namaskāra! Ēnādrū sahāya bēkittā? Ellige hōgbēku?',
      englishTranslation: 'Hello! Do you need some help? Where do you need to go?',
      suggestedReplies: [
        'ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ದಾರಿ ಎಲ್ಲಿದೆ? (Where is the way to the Metro station?)',
        'ಇಲ್ಲಿಂದ ಮೆಜೆಸ್ಟಿಕ್ ಎಷ್ಟು ದೂರ ಇದೆ? (How far is Majestic from here?)',
        'ನಾನು ನಡೆದುಕೊಂಡು ಹೋಗಬಹುದಾ? (Can I go by walking?)',
      ],
    },
  },
  {
    id: 'travel-auto',
    title: 'Taking an Auto Rickshaw',
    kannadaTitle: 'ಆಟೋ ಪ್ರಯಾಣ — ಮೀಟರ್ ಹಾಕಿ',
    category: 'travel',
    difficulty: 'elementary',
    description:
      'Hail an auto rickshaw in Indiranagar, negotiate destination, politely ask for meter fare, and give road directions.',
    location: '100 Feet Road, Indiranagar, Bengaluru',
    estimatedMinutes: 6,
    targetTurns: 6,
    character: {
      name: 'Chethan',
      kannadaName: 'ಚೇತನ್',
      role: 'Bengaluru Auto Driver',
      avatar: '🛺',
      persona:
        'A street-smart auto driver from Rajajinagar who has been driving across Bengaluru for 12 years. Appreciates passengers who speak respectful Kannada.',
      tone: 'Frank, practical, street-smart',
      voiceGender: 'male',
    },
    objective:
      'State destination, ask to turn on the meter ("ಮೀಟರ್ ಹಾಕಿ"), guide the driver ("ಇಲ್ಲೇ ನಿಲ್ಲಿಸಿ"), and pay the fare.',
    culturalContext:
      'Asking "ಮೀಟರ್ ಹಾಕಿ ಅಣ್ಣ" (Put the meter on, brother) politely is the hallmark of respectful navigation in Bengaluru.',
    usefulVocabulary: [
      { kannada: 'ಮೀಟರ್ ಹಾಕಿ', transliteration: 'Meeṭar hāki', english: 'Put on the meter' },
      { kannada: 'ಬರ್ತೀರಾ?', transliteration: 'Barteerā?', english: 'Will you come? (polite)' },
      { kannada: 'ಇಲ್ಲೇ ನಿಲ್ಲಿಸಿ', transliteration: 'Illē nillisi', english: 'Stop right here' },
      { kannada: 'ಎಷ್ಟು ಆಯ್ತು?', transliteration: 'Eshtu aaytu?', english: 'How much is it?' },
      { kannada: 'ಚಿಲ್ಲರೆ ಇದೆಯಾ?', transliteration: 'Chillare ideyā?', english: 'Do you have change?' },
    ],
    expectedOutcomes: [
      'Hail auto with destination: "[Place] ಗೆ ಬರ್ತೀರಾ?"',
      'Politely demand meter usage: "ಮೀಟರ್ ಹಾಕಿ"',
      'Signal stop: "ಮುಂದೆ ಎಡಗಡೆ ನಿಲ್ಲಿಸಿ"',
    ],
    initialMessage: {
      kannadaText: 'ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು ಸ್ವಾಮಿ? ಇಂದಿರಾನಗರ ಮೆಟ್ರೋ ಹತ್ರನಾ?',
      transliteration: 'Ellige hōgbēku swāmi? Indirānagara meṭrō hatranā?',
      englishTranslation: 'Where do you need to go sir? Near Indiranagar Metro?',
      suggestedReplies: [
        'ಎಂ.ಜಿ. ರೋಡ್‌ಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ. (Will you come to M.G. Road? Put the meter on.)',
        'ಕೋರಮಂಗಲಕ್ಕೆ ಎಷ್ಟು ಆಗುತ್ತೆ? (How much will it be to Koramangala?)',
        'ಹೌದು, ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಬಳಿ ನಿಲ್ಲಿಸಿ. (Yes, stop near the Metro station.)',
      ],
    },
  },
  {
    id: 'neighbour-chat',
    title: 'Chatting with a Neighbour',
    kannadaTitle: 'ನೆರೆಹೊರೆಯವರ ಜೊತೆ ಮಾತುಕತೆ',
    category: 'social',
    difficulty: 'elementary',
    description:
      'Engage in a warm weekend courtyard conversation with your friendly Kannada neighbour in Jayanagar.',
    location: '4th Block, Jayanagar, Bengaluru',
    estimatedMinutes: 6,
    targetTurns: 6,
    character: {
      name: 'Sumithra',
      kannadaName: 'ಸುಮಿತ್ರಾ',
      role: 'Friendly Homemaker & Neighbour',
      avatar: '🏡',
      persona:
        'A kind-hearted Mysore-origin homemaker who loves gardening and exchanging food with neighbours. Frequently shares festival sweets.',
      tone: 'Warm, maternal, gentle',
      voiceGender: 'female',
    },
    objective:
      'Inquire about their well-being ("ಹೇಗಿದ್ದೀರಿ?"), discuss weekend weather, and politely accept or exchange tea/snacks.',
    culturalContext:
      '"ಊಟ ಆಯ್ತಾ?" (Did you have food?) is Karnataka’s quintessential friendly greeting, carrying warmth akin to "How are you doing?".',
    usefulVocabulary: [
      { kannada: 'ಹೇಗಿದ್ದೀರಿ?', transliteration: 'Hēgiddīri?', english: 'How are you?' },
      { kannada: 'ಊಟ ಆಯ್ತಾ?', transliteration: 'Ūṭa āytā?', english: 'Did you have food?' },
      { kannada: 'ಮನೆಗೆ ಬನ್ನಿ', transliteration: 'Manege banni', english: 'Please come home' },
      { kannada: 'ಚಹಾ ಕುಡಿಯಿರಿ', transliteration: 'Chahā kuḍiyiri', english: 'Have some tea' },
      { kannada: 'ವಾರಾಂತ್ಯ ಹೇಗಿತ್ತು?', transliteration: 'Vārāntya hēgittu?', english: 'How was your weekend?' },
    ],
    expectedOutcomes: [
      'Greet with "ಹೇಗಿದ್ದೀರಿ?" and "ಊಟ ಆಯ್ತಾ?"',
      'Talk about weekend plans simply',
      'Use respectful hospitality phrases ("ಮನೆಗೆ ಬನ್ನಿ")',
    ],
    initialMessage: {
      kannadaText: 'ನಮಸ್ಕಾರ! ಶುಭೋದಯ! ಹೇಗಿದ್ದೀರಿ? ಇವತ್ತು ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ ಅಲ್ವಾ?',
      transliteration: 'Namaskāra! Shubhōdaya! Hēgiddīri? Ivattu havāmāna tumbā chennāgide alvā?',
      englishTranslation: 'Hello! Good morning! How are you? The weather is very nice today, isn’t it?',
      suggestedReplies: [
        'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ನೀವು ಹೇಗಿದ್ದೀರಿ? (I am fine, how are you?)',
        'ಹೌದು, ಬೆಂಗಳೂರು ಹವಾಮಾನ ಯಾವಾಗಲೂ ಸೂಪರ್! (Yes, Bengaluru weather is always super!)',
        'ನಿಮ್ಮ ಊಟ ಆಯ್ತಾ ಆಂಟಿ? (Did you have food, Aunty?)',
      ],
    },
  },
  {
    id: 'hospital-reception',
    title: 'Hospital Reception Desk',
    kannadaTitle: 'ಆಸ್ಪತ್ರೆ ಸ್ವಾಗತ ಕೌಂಟರ್',
    category: 'health',
    difficulty: 'intermediate',
    description:
      'Book a doctor appointment, describe symptoms like fever or cough, and ask for the pharmacy location.',
    location: 'Victoria Hospital / Manipal Hospital, Bengaluru',
    estimatedMinutes: 7,
    targetTurns: 7,
    character: {
      name: 'Deepa',
      kannadaName: 'ದೀಪಾ',
      role: 'Hospital Desk Officer',
      avatar: '🏥',
      persona:
        'A composed, professional healthcare receptionist who speaks clear administrative Kannada and assists patients with empathy.',
      tone: 'Professional, empathetic, precise',
      voiceGender: 'female',
    },
    objective:
      'Explain that you need to see a general physician, describe your fever/cold, get an appointment token, and find the medicine counter.',
    culturalContext:
      'Expressing physical health in Kannada uses the dative case for sensations: "ನನಗೆ ಜ್ವರ ಇದೆ" (To me fever is there = I have a fever).',
    usefulVocabulary: [
      { kannada: 'ಜ್ವರ ಇದೆ', transliteration: 'Jvara ide', english: 'Have fever' },
      { kannada: 'ತಲೆನೋವು', transliteration: 'Talenōvu', english: 'Headache' },
      { kannada: 'ವೈದ್ಯರು', transliteration: 'Vaidyaru', english: 'Doctor' },
      { kannada: 'ಔಷಧಾಲಯ', transliteration: 'Aushadhālaya', english: 'Pharmacy / Medical shop' },
      { kannada: 'ಟೋಕನ್ ನಂಬರ್', transliteration: 'Tōkan nambar', english: 'Token number' },
    ],
    expectedOutcomes: [
      'Express symptoms with "ನನಗೆ [ಜ್ವರ / ಶೀತ / ತಲೆನೋವು] ಇದೆ"',
      'Request appointment: "ಡಾಕ್ಟರ್ ಯಾವಾಗ ಸಿಗ್ತಾರೆ?"',
      'Inquire about medical billing & pharmacy',
    ],
    initialMessage: {
      kannadaText: 'ನಮಸ್ಕಾರ, ಇದು ಮಣಿಪಾಲ್ ಆಸ್ಪತ್ರೆ ಸ್ವಾಗತ ಕೌಂಟರ್. ನಿಮಗೆ ಯಾವ ತೊಂದರೆ ಆಗಿದೆ?',
      transliteration: 'Namaskāra, idu Maṇipāl āspatre svāgata kaunṭar. Nimage yāva tondare āgide?',
      englishTranslation: 'Hello, this is Manipal Hospital reception. What trouble/symptom do you have?',
      suggestedReplies: [
        'ನನಗೆ ಎರಡು ದಿನಗಳಿಂದ ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ಇದೆ. (I have fever and headache for 2 days.)',
        'ಜನರಲ್ ಫಿಸಿಶಿಯನ್ ಭೇಟಿ ಮಾಡಬೇಕು. (I need to meet a General Physician.)',
        'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಶುಲ್ಕ ಎಷ್ಟು? (How much is the appointment fee?)',
      ],
    },
  },
  {
    id: 'workplace-conversation',
    title: 'Workplace Tech Standup',
    kannadaTitle: 'ಕಚೇರಿಯಲ್ಲಿ ಸಹೋದ್ಯೋಗಿಯ ಜೊತೆ ಮಾತುಕತೆ',
    category: 'workplace',
    difficulty: 'intermediate',
    description:
      'Collaborate with a tech teammate in Electronic City: discuss project tickets, review code, and propose lunch.',
    location: 'Manyata Tech Park / Electronic City, Bengaluru',
    estimatedMinutes: 7,
    targetTurns: 7,
    character: {
      name: 'Karthik',
      kannadaName: 'ಕಾರ್ತಿಕ್',
      role: 'Senior Software Engineer',
      avatar: '💻',
      persona:
        'A Bengaluru techie who enjoys mixing tech lingo with natural Kannada. Excited to help non-local engineers feel integrated into Karnataka tech workplaces.',
      tone: 'Collegial, tech-fluent, modern',
      voiceGender: 'male',
    },
    objective:
      'Discuss today\'s development task in Kannada, ask for a code review ("ಕೋಡ್ ರಿವ್ಯೂ ಮಾಡಿ"), and invite them for lunch.',
    culturalContext:
      'Karnataka tech hubs have a vibrant culture of bilingual Kannada-English ("Kanglish") conversation. Learning Kannada phrases fosters strong camaraderie.',
    usefulVocabulary: [
      { kannada: 'ಕೆಲಸ', transliteration: 'Kelasa', english: 'Work / Task' },
      { kannada: 'ಮುಗಿದಿದೆ', transliteration: 'Mugidide', english: 'Completed / Finished' },
      { kannada: 'ಸಹಾಯ ಬೇಕು', transliteration: 'Sahāya bēku', english: 'Need help' },
      { kannada: 'ಊಟಕ್ಕೆ ಹೋಗೋಣ್ವಾ?', transliteration: 'Ūṭakke hōgōṇvā?', english: 'Shall we go for lunch?' },
      { kannada: 'ಸಭೆ', transliteration: 'Sabhe', english: 'Meeting' },
    ],
    expectedOutcomes: [
      'Report status: "ನನ್ನ ಕೆಲಸ ಮುಗಿದಿದೆ" (My work is done)',
      'Request peer feedback: "ದಯವಿಟ್ಟು ಇದು ನೋಡಿ"',
      'Propose lunch or coffee: "ಕಾಫಿ ಕುಡಿಯೋಣ್ವಾ?"',
    ],
    initialMessage: {
      kannadaText: 'ಹೇ ಕಾರ್ತಿಕ್ ಇಲ್ಲೇ ಇದ್ದೇನೆ! ಇವತ್ತಿನ ಸ್ಪ್ರಿಂಟ್ ಟಾಸ್ಕ್ ಹೇಗೆ ಹೋಗ್ತಾ ಇದೆ?',
      transliteration: 'Hē Kārtik illē iddēne! Ivattina sprint ṭāsk hēge hōgtā ide?',
      englishTranslation: 'Hey Karthik here! How is today’s sprint task going?',
      suggestedReplies: [
        'ನನ್ನ ಟಾಸ್ಕ್ ಬಹುತೇಕ ಮುಗಿದಿದೆ, ಒಂದು ಸಣ್ಣ ಡೌಟ್ ಇದೆ. (My task is mostly done, I have a small doubt.)',
        'ಸ್ವಲ್ಪ ಸಮಯ ಸಿಕ್ಕರೆ ನನ್ನ ಪುಲ್ ರಿಕ್ವೆಸ್ಟ್ (PR) ನೋಡ್ತೀರಾ? (If you get some time, will you look at my PR?)',
        'ಒಂದು ಕಾಫಿ ಬ್ರೇಕ್ ತಗೋಳೋಣ್ವಾ? (Shall we take a coffee break?)',
      ],
    },
  },
];

export function getScenarioById(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getAllScenarios(): ScenarioDefinition[] {
  return SCENARIOS;
}

