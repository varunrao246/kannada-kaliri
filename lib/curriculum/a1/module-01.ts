/**
 * Module 1: Kannada Foundations (ಕನ್ನಡ ಅಡಿಪಾಯಗಳು)
 * Course Level: A1 Beginner
 * Kannada Kaliri
 */

import type { Module } from '@/types/curriculum';

export const module01: Module = {
  id: 'a1-mod-01',
  courseId: 'course-a1-beginner',
  title: 'Kannada Foundations',
  kannadaTitle: 'ಕನ್ನಡ ಅಡಿಪಾಯಗಳು',
  description: 'Master the Kannada alphabet, vowel sounds, consonant families, and essential polite greetings.',
  displayOrder: 1,
  lessons: [
    {
      id: 'a1-m01-l01',
      moduleId: 'a1-mod-01',
      title: 'Introduction to Vowels (ಸ್ವರಗಳು)',
      kannadaTitle: 'ಸ್ವರಗಳು - Swaragalu',
      description: 'Learn the primary Kannada vowels (Swaragalu), their phonetic sounds, and how they form words.',
      estimatedMinutes: 10,
      displayOrder: 1,
      isPublished: true,
      content: {
        introduction:
          'In Kannada, vowels are called "Swaragalu" (ಸ್ವರಗಳು). There are 14 primary vowels divided into short (Hrasva), long (Deergha), and diphthongs. They are the musical building blocks of the language.',
        objectives: [
          'Recognize and pronounce short and long Kannada vowels',
          'Understand phonetic differences between "a" and "aa", "i" and "ee"',
          'Recognize basic vowel-starting words in daily Kannada',
        ],
        vocabulary: [
          {
            id: 'v1-1',
            kannada: 'ಅ',
            transliteration: 'a',
            meaningEn: 'Short vowel sound like "u" in "cup"',
            meaningNative: {
              hi: 'अ (छोटा स्वर, जैसे "अमर")',
              ta: 'அ (குறில் உயிர் எழுத்து)',
              te: 'అ (హ్రస్వ అచ్చు)',
              ml: 'അ (ഹ്രസ്വ സ്വരം)',
            },
            culturalNote: 'First letter of the Kannada alphabet, representing origin and life.',
          },
          {
            id: 'v1-2',
            kannada: 'ಆ',
            transliteration: 'aa',
            meaningEn: 'Long vowel sound like "a" in "father"',
            meaningNative: {
              hi: 'आ (दीर्घ स्वर, जैसे "आनंद")',
              ta: 'ஆ (நெடில் உயிர் எழுத்து)',
              te: 'ఆ (దీర్ఘ అచ్చు)',
              ml: 'ആ (ദീർഘ സ്വരം)',
            },
          },
          {
            id: 'v1-3',
            kannada: 'ಅಮ್ಮ',
            transliteration: 'Amma',
            meaningEn: 'Mother',
            meaningNative: {
              hi: 'माँ (माताजी)',
              ta: 'அம்மா',
              te: 'అమ్మ',
              ml: 'അമ്മ',
            },
            culturalNote: 'One of the most universal and revered words across all South Indian languages.',
          },
          {
            id: 'v1-4',
            kannada: 'ಆನೆ',
            transliteration: 'Aane',
            meaningEn: 'Elephant',
            meaningNative: {
              hi: 'हाथी',
              ta: 'யானை',
              te: 'ఏనుగు',
              ml: 'ആന',
            },
            culturalNote: 'Elephants are central to Karnataka culture and the world-famous Mysuru Dasara procession (Jumboo Savari).',
          },
          {
            id: 'v1-5',
            kannada: 'ಇಲ್ಲಿ',
            transliteration: 'Illi',
            meaningEn: 'Here',
            meaningNative: {
              hi: 'यहाँ (यहाँ पर)',
              ta: 'இங்கே',
              te: 'ఇక్కడ',
              ml: 'ഇവിടെ',
            },
          },
          {
            id: 'v1-6',
            kannada: 'ಅಲ್ಲಿ',
            transliteration: 'Alli',
            meaningEn: 'There',
            meaningNative: {
              hi: 'वहाँ (वहाँ पर)',
              ta: 'அங்கே',
              te: 'అక్కడ',
              ml: 'അവിടെ',
            },
          },
        ],
        grammarTips: [
          {
            title: 'Proximate vs Distant Demonstratives (ಇ vs ಅ)',
            explanation:
              'In Kannada, words starting with "ಇ" (I) denote proximity (near the speaker: "Illi" = here, "Idu" = this), while words starting with "ಅ" (A) denote distance ("Alli" = there, "Adu" = that).',
            example: 'ಇಲ್ಲಿ ಬನ್ನಿ (Illi banni - Come here) vs ಅಲ್ಲಿ ನೋಡಿ (Alli nodi - Look there)',
            nativeTip: {
              hi: 'जैसे हिंदी में "इधर" (निकट) और "उधर" (दूर), कन्नड़ में "ಇಲ್ಲಿ" (पास) और "ಅಲ್ಲಿ" (दूर) होता है।',
              ta: 'தமிழைப் போலவே: இங்கே (இಲ್ಲಿ) மற்றும் அங்கே (ಅಲ್ಲಿ).',
              te: 'తెలుగులాగే: ఇక్కడ (ಇಲ್ಲಿ) మరియు అక్కడ (ಅಲ್ಲಿ).',
              ml: 'മലയാളത്തിലെ പോലെ: ഇവിടെ (ಇಲ್ಲಿ), അവിടെ (ಅಲ್ಲಿ).',
            },
          },
        ],
        examples: [
          {
            id: 'ex1-1',
            kannada: 'ಅಮ್ಮ ಇಲ್ಲಿದ್ದಾರೆ.',
            transliteration: 'Amma illidhdhaare.',
            english: 'Mother is here.',
            nativeExplanation: {
              hi: 'माँ यहाँ हैं।',
              ta: 'அம்மா இங்கே இருக்கிறார்.',
              te: 'అమ్మ ఇక్కడ ఉన్నారు.',
              ml: 'അമ്മ ഇവിടെയുണ്ട്.',
            },
          },
          {
            id: 'ex1-2',
            kannada: 'ಆನೆ ಎಲ್ಲಿದೆ?',
            transliteration: 'Aane ellide?',
            english: 'Where is the elephant?',
            nativeExplanation: {
              hi: 'हाथी कहाँ है?',
              ta: 'யானை எங்கே இருக்கிறது?',
              te: 'ఏనుగు ఎక్కడ ఉంది?',
              ml: 'ആന എവിടെയാണ്?',
            },
          },
        ],
        completionCriteria: 'Recognize the sound of Swaragalu and understand the difference between proximate (Illi) and distant (Alli).',
      },
    },
    {
      id: 'a1-m01-l02',
      moduleId: 'a1-mod-01',
      title: 'Consonant Families (ವ್ಯಂಜನಗಳು)',
      kannadaTitle: 'ವ್ಯಂಜನಗಳು - Vyanjanagalu',
      description: 'Explore the structured consonant grid (Ka, Cha, Ta, Tha, Pa) and the unique Kannada retroflex sounds.',
      estimatedMinutes: 12,
      displayOrder: 2,
      isPublished: true,
      content: {
        introduction:
          'Kannada consonants are known as "Vyanjanagalu" (ವ್ಯಂಜನಗಳು). There are 34 consonants arranged in a scientific grid based on the place of articulation: throat (velar), palate (palatal), roof of mouth (retroflex), teeth (dental), and lips (labial).',
        objectives: [
          'Pronounce the Ka-varga, Cha-varga, and Ta-varga consonants',
          'Master the distinctive Kannada retroflex "ಳ" (retroflex La) sound',
          'Build familiar words with simple consonant syllables',
        ],
        vocabulary: [
          {
            id: 'v1-7',
            kannada: 'ಕನ್ನಡ',
            transliteration: 'Kannada',
            meaningEn: 'The Kannada language and heritage',
            meaningNative: {
              hi: 'कन्नड़ भाषा और संस्कृति',
              ta: 'கன்னட மொழி',
              te: 'కన్నడ భాష',
              ml: 'കന്നഡ ഭാഷ',
            },
            culturalNote: 'Kannada is a classical Indian language with over 2,000 years of documented history.',
          },
          {
            id: 'v1-8',
            kannada: 'ಮನೆ',
            transliteration: 'Mane',
            meaningEn: 'House / Home',
            meaningNative: {
              hi: 'घर',
              ta: 'வீடு / மனை',
              te: 'ఇల్లు / మనే',
              ml: 'വീട്',
            },
          },
          {
            id: 'v1-9',
            kannada: 'ನೀರು',
            transliteration: 'Neeru',
            meaningEn: 'Water',
            meaningNative: {
              hi: 'पानी',
              ta: 'தண்ணீர் / நீர்',
              te: 'నీరు / నీళ్ళు',
              ml: 'വെള്ളം / നീര്',
            },
          },
          {
            id: 'v1-10',
            kannada: 'ಹಾಲು',
            transliteration: 'Haalu',
            meaningEn: 'Milk',
            meaningNative: {
              hi: 'दूध',
              ta: 'பால்',
              te: 'పాలు',
              ml: 'പാൽ',
            },
          },
        ],
        grammarTips: [
          {
            title: 'The Special Retroflex "ಳ" (Lha)',
            explanation:
              'Kannada has two distinct L sounds: standard dental "ಲ" (La as in love) and retroflex "ಳ" (curling the tip of the tongue backwards against the hard palate, like in "Bengaluru" or "Keli").',
            example: 'ಬೆಂಗಳೂರು (Bengaluru), ಕೇಳಿ (Keli - please listen)',
          },
        ],
        examples: [
          {
            id: 'ex1-3',
            kannada: 'ಮನೆಯಲ್ಲಿ ನೀರು ಇದೆ.',
            transliteration: 'Maneyalli neeru ide.',
            english: 'There is water in the house.',
            nativeExplanation: {
              hi: 'घर में पानी है।',
              ta: 'வீட்டில் தண்ணீர் இருக்கிறது.',
              te: 'ఇంట్లో నీరు ఉంది.',
              ml: 'വീട്ടിൽ വെള്ളമുണ്ട്.',
            },
          },
        ],
        completionCriteria: 'Pronounce the primary consonant sounds and differentiate between simple and retroflex letters.',
      },
    },
    {
      id: 'a1-m01-l03',
      moduleId: 'a1-mod-01',
      title: 'Everyday Greetings & Politeness',
      kannadaTitle: 'ನಮಸ್ಕಾರ ಮತ್ತು ವಂದನೆಗಳು',
      description: 'Learn the primary greetings, respectful honorifics (Ree, Saaru), and polite expressions for daily life.',
      estimatedMinutes: 10,
      displayOrder: 3,
      isPublished: true,
      content: {
        introduction:
          'Warmth, respect, and hospitality are the pillars of Karnataka culture. Learning polite greetings instantly dissolves social barriers and wins the respect of locals.',
        objectives: [
          'Greet people at different times of the day with proper respect',
          'Use the polite suffix "ರಿ" (ree) and words like "ಧನ್ಯವಾದಗಳು" (Dhanyavadagalu)',
          'Ask "How are you?" respectfully and respond pleasantly',
        ],
        vocabulary: [
          {
            id: 'v1-11',
            kannada: 'ನಮಸ್ಕಾರ',
            transliteration: 'Namaskara',
            meaningEn: 'Hello / Greetings / Respectful salute',
            meaningNative: {
              hi: 'नमस्ते / नमस्कार',
              ta: 'வணக்கம்',
              te: 'నమస్కారము',
              ml: 'നമസ്കാരം',
            },
            culturalNote: 'The universal Kannada greeting, appropriate for any time of day.',
          },
          {
            id: 'v1-12',
            kannada: 'ಧನ್ಯವಾದಗಳು',
            transliteration: 'Dhanyavadagalu',
            meaningEn: 'Thank you (formal & sincere)',
            meaningNative: {
              hi: 'धन्यवाद',
              ta: 'நன்றி',
              te: 'ధన్యవాదాలు',
              ml: 'നന്ദി',
            },
          },
          {
            id: 'v1-13',
            kannada: 'ನೀವು ಹೇಗಿದ್ದೀರಾ?',
            transliteration: 'Neevu hegiddira?',
            meaningEn: 'How are you? (Polite & respectful)',
            meaningNative: {
              hi: 'आप कैसे हैं?',
              ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
              te: 'మీరు ఎలా ఉన్నారు?',
              ml: 'സുഖമാണോ? / അങ്ങ് എങ്ങനെയുണ്ട്?',
            },
          },
          {
            id: 'v1-14',
            kannada: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ',
            transliteration: 'Naanu chennagiddini',
            meaningEn: 'I am doing well / I am good',
            meaningNative: {
              hi: 'मैं ठीक हूँ / अच्छा हूँ',
              ta: 'நான் நன்றாக இருக்கிறேன்',
              te: 'నేను బాగున్నాను',
              ml: 'എനിക്ക് സുഖമാണ്',
            },
          },
          {
            id: 'v1-15',
            kannada: 'ಬನ್ನಿ',
            transliteration: 'Banni',
            meaningEn: 'Please come (respectful)',
            meaningNative: {
              hi: 'आइए / पधारिए',
              ta: 'வாருங்கள்',
              te: 'రండి',
              ml: 'വരൂ',
            },
          },
          {
            id: 'v1-16',
            kannada: 'ಕೂತ್ಕೊಳ್ಳಿ',
            transliteration: 'Kootkoli',
            meaningEn: 'Please sit down',
            meaningNative: {
              hi: 'बैठिए',
              ta: 'உட்காருங்கள்',
              te: 'కూర్చోండి',
              ml: 'ഇരിക്കൂ',
            },
          },
        ],
        grammarTips: [
          {
            title: 'The Respect Marker: "ಇರಿ" / "ರಿ" (iri / ree)',
            explanation:
              'In Kannada, verb endings change depending on respect. "Baa" is casual (come), while "Banni" is polite. Adding "ರಿ" (ree) to a greeting or question shows immense warmth and politeness.',
            example: 'ಹೌದ್ರಿ (Houdree - Yes sir/ma\'am), ನಮಸ್ಕಾರ್ರೀ (Namaskararee)',
            nativeTip: {
              hi: 'जैसे हिंदी में "आओ" बनाम "आइए", कन्नड़ में "ಬಾ" (Baa) और "ಬನ್ನಿ" (Banni) होता है।',
              ta: 'தமிழில் "வா" மற்றும் "வாருங்கள்" போன்றது.',
              te: 'తెలుగులో "రా" మరియు "రండి" లాంటిది.',
              ml: 'മലയാളത്തിൽ "വാ" மற்றும் "വരൂ" പോലെ.',
            },
          },
        ],
        examples: [
          {
            id: 'ex1-4',
            kannada: 'ನಮಸ್ಕಾರ ಸರ್, ನೀವು ಹೇಗಿದ್ದೀರಾ?',
            transliteration: 'Namaskara sir, neevu hegiddira?',
            english: 'Hello sir, how are you?',
            nativeExplanation: {
              hi: 'नमस्ते सर, आप कैसे हैं?',
              ta: 'வணக்கம் ஐயா, நீங்கள் எப்படி இருக்கிறீர்கள்?',
              te: 'నమస్కారం సర్, మీరు ఎలా ఉన్నారు?',
              ml: 'നമസ്കാരം സാർ, അങ്ങേയ്ക്ക് സുഖമാണോ?',
            },
          },
          {
            id: 'ex1-5',
            kannada: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ, ಧನ್ಯವಾದಗಳು!',
            transliteration: 'Naanu chennagiddini, dhanyavadagalu!',
            english: 'I am doing well, thank you!',
            nativeExplanation: {
              hi: 'मैं ठीक हूँ, धन्यवाद!',
              ta: 'நான் நன்றாக இருக்கிறேன், நன்றி!',
              te: 'నేను బాగున్నాను, ధన్యవాదాలు!',
              ml: 'എനിക്ക് സുഖമാണ്, നന്ദി!',
            },
          },
        ],
        completionCriteria: 'Engage in a basic 2-way greeting dialogue: greet, ask how they are, respond, and say thank you.',
      },
    },
  ],
};

