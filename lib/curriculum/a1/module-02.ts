/**
 * Module 2: Everyday Vocabulary (ದೈನಂದಿನ ಶಬ್ದಕೋಶ)
 * Course Level: A1 Beginner
 * Kannada Kaliri
 */

import type { Module } from '@/types/curriculum';

export const module02: Module = {
  id: 'a1-mod-02',
  courseId: 'course-a1-beginner',
  title: 'Everyday Vocabulary',
  kannadaTitle: 'ದೈನಂದಿನ ಶಬ್ದಕೋಶ',
  description: 'Count numbers, tell days and time, name family members, order favorite Karnataka food, and identify common items.',
  displayOrder: 2,
  lessons: [
    {
      id: 'a1-m02-l01',
      moduleId: 'a1-mod-02',
      title: 'Numbers 1 to 10 (ಸಂಖ್ಯೆಗಳು)',
      kannadaTitle: 'ಸಂಖ್ಯೆಗಳು: ೧ ರಿಂದ ೧೦',
      description: 'Master counting 1 to 10 in Kannada for everyday buying, prices, and counting items.',
      estimatedMinutes: 8,
      displayOrder: 1,
      isPublished: true,
      content: {
        introduction:
          'Numbers in Kannada are essential whether you are buying vegetables, asking for the auto-fare, or telling the time.',
        objectives: [
          'Count fluently from 1 to 10 in Kannada',
          'Use numbers when ordering food (Ondu dose, Eradu coffee)',
          'Recognize numbers when prices are mentioned by shopkeepers',
        ],
        vocabulary: [
          { id: 'v2-1', kannada: 'ಒಂದು', transliteration: 'Ondu', meaningEn: 'One (1)', meaningNative: { hi: 'एक', ta: 'ஒன்று', te: 'ఒకటి', ml: 'ഒന്ന്' } },
          { id: 'v2-2', kannada: 'ಎರಡು', transliteration: 'Eradu', meaningEn: 'Two (2)', meaningNative: { hi: 'दो', ta: 'இரண்டு', te: 'రెండు', ml: 'രണ്ട്' } },
          { id: 'v2-3', kannada: 'ಮೂರು', transliteration: 'Mooru', meaningEn: 'Three (3)', meaningNative: { hi: 'तीन', ta: 'மூன்று', te: 'మూడు', ml: 'മൂന്ന്' } },
          { id: 'v2-4', kannada: 'ನಾಲ್ಕು', transliteration: 'Naalku', meaningEn: 'Four (4)', meaningNative: { hi: 'चार', ta: 'நான்கு', te: 'నాలుగు', ml: 'നാല്' } },
          { id: 'v2-5', kannada: 'ಐದು', transliteration: 'Aidu', meaningEn: 'Five (5)', meaningNative: { hi: 'पाँच', ta: 'ஐந்து', te: 'ఐదు', ml: 'അഞ്ച്' } },
          { id: 'v2-6', kannada: 'ಆರು', transliteration: 'Aaru', meaningEn: 'Six (6)', meaningNative: { hi: 'छह', ta: 'ஆறு', te: 'ఆరు', ml: 'ആറ്' } },
          { id: 'v2-7', kannada: 'ಏಳು', transliteration: 'Eylu', meaningEn: 'Seven (7)', meaningNative: { hi: 'सात', ta: 'ஏழு', te: 'ఏడు', ml: 'ഏഴ്' } },
          { id: 'v2-8', kannada: 'ಎಂಟು', transliteration: 'Entu', meaningEn: 'Eight (8)', meaningNative: { hi: 'आठ', ta: 'எட்டு', te: 'ఎనిమిది', ml: 'എട്ട്' } },
          { id: 'v2-9', kannada: 'ಒಂಬತ್ತು', transliteration: 'Ombhatthu', meaningEn: 'Nine (9)', meaningNative: { hi: 'नौ', ta: 'ஒன்பது', te: 'తొమ్మిది', ml: 'ഒമ്പത്' } },
          { id: 'v2-10', kannada: 'ಹತ್ತು', transliteration: 'Hatthu', meaningEn: 'Ten (10)', meaningNative: { hi: 'दस', ta: 'பத்து', te: 'పది', ml: 'പത്ത്' } },
        ],
        grammarTips: [
          {
            title: 'Ordering with Numbers',
            explanation: 'In Kannada, place the number before the noun when counting or requesting items.',
            example: 'ಒಂದು ಕಾಫಿ ಕೊಡಿ (Ondu coffee kodi - Give one coffee), ಎರಡು ಟಿಕೆಟ್ (Eradu ticket - Two tickets)',
          },
        ],
        examples: [
          {
            id: 'ex2-1',
            kannada: 'ಒಂದು ಟೀ ಮತ್ತು ಎರಡು ಬಿಸ್ಕತ್ತು ಕೊಡಿ.',
            transliteration: 'Ondu tea matthu eradu biscuit kodi.',
            english: 'Please give one tea and two biscuits.',
            nativeExplanation: {
              hi: 'एक चाय और दो बिस्किट दीजिए।',
              ta: 'ஒரு தேநீர் மற்றும் இரண்டு பிஸ்கட் கொடுங்கள்.',
              te: 'ఒక టీ మరియు రెండు బిస్కెట్లు ఇవ్వండి.',
              ml: 'ഒരു ചായയും രണ്ട് ബിസ്ക്കറ്റും തരൂ.',
            },
          },
        ],
        completionCriteria: 'Accurately count from 1 to 10 and request items with specific quantities.',
      },
    },
    {
      id: 'a1-m02-l02',
      moduleId: 'a1-mod-02',
      title: 'Days and Time (ದಿನಗಳು ಮತ್ತು ಸಮಯ)',
      kannadaTitle: 'ದಿನಗಳು ಮತ್ತು ಸಮಯ',
      description: 'Learn days of the week, temporal indicators (today, tomorrow, yesterday), and telling time.',
      estimatedMinutes: 10,
      displayOrder: 2,
      isPublished: true,
      content: {
        introduction:
          'Scheduling appointments, planning weekend getaways, and talking about your routine starts with days and time.',
        objectives: [
          'Say today (Ivaathu), tomorrow (Naale), and yesterday (Nenne)',
          'Identify the seven days of the week in Kannada',
          'Ask what time it is currently',
        ],
        vocabulary: [
          { id: 'v2-11', kannada: 'ಇವತ್ತು', transliteration: 'Ivaathu', meaningEn: 'Today', meaningNative: { hi: 'आज', ta: 'இன்று', te: 'ఈరోజు', ml: 'ഇന്ന്' } },
          { id: 'v2-12', kannada: 'ನಾಳೆ', transliteration: 'Naale', meaningEn: 'Tomorrow', meaningNative: { hi: 'कल (आने वाला)', ta: 'நாளை', te: 'రేపు', ml: 'നാളെ' } },
          { id: 'v2-13', kannada: 'ನಿನ್ನೆ', transliteration: 'Nenne', meaningEn: 'Yesterday', meaningNative: { hi: 'कल (बीता हुआ)', ta: 'நேற்று', te: 'నిన్న', ml: 'ഇന്നലെ' } },
          { id: 'v2-14', kannada: 'ಸೋಮವಾರ', transliteration: 'Somavaara', meaningEn: 'Monday', meaningNative: { hi: 'सोमवार', ta: 'திங்கட்கிழமை', te: 'సోమవారం', ml: 'തിങ്കളാഴ്ച' } },
          { id: 'v2-15', kannada: 'ಶುಕ್ರವಾರ', transliteration: 'Shukravaara', meaningEn: 'Friday', meaningNative: { hi: 'शुक्रवार', ta: 'வெள்ளிக்கிழமை', te: 'శుక్రవారం', ml: 'വെള്ളിയാഴ്ച' } },
          { id: 'v2-16', kannada: 'ಭಾನುವಾರ', transliteration: 'Bhaanuvaara', meaningEn: 'Sunday', meaningNative: { hi: 'रविवार', ta: 'ஞாயிற்றுக்கிழமை', te: 'ఆదివారం', ml: 'ഞായറാഴ്ച' } },
          { id: 'v2-17', kannada: 'ಸಮಯ / ಹೊತ್ತು', transliteration: 'Samaya / Hotthu', meaningEn: 'Time', meaningNative: { hi: 'समय / वक़्त', ta: 'நேரம்', te: 'సమయం', ml: 'സമയം' } },
        ],
        grammarTips: [
          {
            title: 'Asking "What is the time?"',
            explanation: 'To ask the time in Kannada, say: "Eshtu gante aaythu?" (ಎಷ್ಟು ಗಂಟೆ ಆಯ್ತು? - What hour has struck?).',
            example: 'ಈಗ ಎಷ್ಟು ಗಂಟೆ? (Eega eshtu gante? - What time is it now?)',
          },
        ],
        examples: [
          {
            id: 'ex2-2',
            kannada: 'ನಾಳೆ ಆಫೀಸ್ ಇದೆಯಾ?',
            transliteration: 'Naale office ideya?',
            english: 'Is there office tomorrow?',
            nativeExplanation: {
              hi: 'क्या कल ऑफिस है?',
              ta: 'நாளை அலுவலகம் இருக்கிறதா?',
              te: 'రేపు ఆఫీస్ ఉందా?',
              ml: 'നാളെ ഓഫീസുണ്ടോ?',
            },
          },
        ],
        completionCriteria: 'Use today, tomorrow, and yesterday in everyday questions.',
      },
    },
    {
      id: 'a1-m02-l03',
      moduleId: 'a1-mod-02',
      title: 'Food, Drinks & Darshini Delights',
      kannadaTitle: 'ಆಹಾರ ಮತ್ತು ಪಾನೀಯಗಳು',
      description: 'Order food like a true local: Dosa, Idli, Filter Coffee, meals, and customize sugar or spicy levels.',
      estimatedMinutes: 10,
      displayOrder: 3,
      isPublished: true,
      content: {
        introduction:
          'Karnataka culinary culture is legendary: crispy Benne Dose in Davanagere, piping hot filter coffee in Bengaluru, and aromatic Jolada Rotti in North Karnataka.',
        objectives: [
          'Order breakfast, meals, and drinks with confidence at Darshini restaurants',
          'Ask for hot water, less spice, or without sugar',
          'Understand typical bill payment phrases',
        ],
        vocabulary: [
          { id: 'v2-18', kannada: 'ತಿಂಡಿ', transliteration: 'Thindi', meaningEn: 'Breakfast / Snacks', meaningNative: { hi: 'नाश्ता', ta: 'சிற்றுண்டி', te: 'అల్పాహారం / టిఫిన్', ml: 'പലഹാരം' } },
          { id: 'v2-19', kannada: 'ಊಟ', transliteration: 'Oota', meaningEn: 'Lunch / Dinner / Full Meal', meaningNative: { hi: 'भोजन / खाना', ta: 'சாப்பாடு', te: 'భోజనం', ml: 'ഊണ്' }, culturalNote: 'Kannadigas distinguish between light snacks (Thindi) and full meals (Oota).' },
          { id: 'v2-20', kannada: 'ದೋಸೆ', transliteration: 'Dose', meaningEn: 'Dosa (traditional fermented crepe)', meaningNative: { hi: 'डोसा', ta: 'தோசை', te: 'దోస', ml: 'ദോശ' } },
          { id: 'v2-21', kannada: 'ಕಾಫಿ', transliteration: 'Coffee', meaningEn: 'Filter coffee', meaningNative: { hi: 'कॉफ़ी', ta: 'காபி', te: 'కాఫీ', ml: 'കാപ്പി' } },
          { id: 'v2-22', kannada: 'ಸಕ್ಕರೆ ಬೇಡ', transliteration: 'Sakkare beda', meaningEn: 'No sugar, please', meaningNative: { hi: 'चीनी नहीं चाहिए', ta: 'சர்க்கரை வேண்டாம்', te: 'చక్కెర వద్దు', ml: 'പഞ്ചസാര വേണ്ട' } },
          { id: 'v2-23', kannada: 'ಸ್ವಲ್ಪ ಖಾರ ಕಡಿಮೆ ಮಾಡಿ', transliteration: 'Svalpa khaara kadime maadi', meaningEn: 'Make it a little less spicy', meaningNative: { hi: 'थोड़ा तीखा कम कीजिए', ta: 'கொஞ்சம் காரம் குறைக்கவும்', te: 'కొంచెం కారం తగ్గించండి', ml: 'കുറച്ച് എരിവ് കുറയ്ക്കൂ' } },
        ],
        grammarTips: [
          {
            title: 'Want vs Do Not Want: ಬೇಕು (Beku) vs ಬೇಡ (Beda)',
            explanation:
              'Two of the most useful words in the entire Kannada language! "Beku" means want / need, while "Beda" means do not want / not needed.',
            example: 'ಕಾಫಿ ಬೇಕು (Coffee beku - I want coffee), ಸಕ್ಕರೆ ಬೇಡ (Sakkare beda - Don\'t want sugar)',
            nativeTip: {
              hi: 'हिंदी में "चाहिए" = ಬೇಕು (Beku), और "नहीं चाहिए" = ಬೇಡ (Beda).',
              ta: 'தமிழில் "வேண்டும்" = ಬೇಕು, "வேண்டாம்" = ಬೇಡ.',
              te: 'తెలుగులో "కావాలి" = ಬೇಕು, "వద్దు" = ಬೇಡ.',
              ml: 'മലയാളത്തിൽ "വേണം" = ಬೇಕು, "വേണ്ട" = ಬೇಡ.',
            },
          },
        ],
        examples: [
          {
            id: 'ex2-3',
            kannada: 'ಅಣ್ಣಾ, ಒಂದು ಮಸಾಲೆ ದೋಸೆ, ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ.',
            transliteration: 'Anna, ondu masale dose, ondu filter coffee kodi.',
            english: 'Brother, please give one masala dosa and one filter coffee.',
            nativeExplanation: {
              hi: 'भैया, एक मसाला डोसा और एक फ़िल्टर कॉफ़ी दीजिए।',
              ta: 'அண்ணா, ஒரு மசாலா தோசை, ஒரு ஃபில்டர் காபி கொடுங்கள்.',
              te: 'అన్నా, ఒక మసాలా దోస మరియు ఒక ఫిల్టర్ కాఫీ ఇవ్వండి.',
              ml: 'ചേട്ടാ, ഒരു മസാല ദോശയും ഒരു ഫിൽട്ടർ കോഫിയും തരൂ.',
            },
          },
        ],
        completionCriteria: 'Fluently order a snack or drink using "kodi", "beku", and customize with "beda".',
      },
    },
  ],
};

