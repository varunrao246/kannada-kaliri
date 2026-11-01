/**
 * Module 3: Building Sentences (ವಾಕ್ಯ ರಚನೆ)
 * Course Level: A1 Beginner
 * Kannada Kaliri
 */

import type { Module } from '@/types/curriculum';

export const module03: Module = {
  id: 'a1-mod-03',
  courseId: 'course-a1-beginner',
  title: 'Building Sentences',
  kannadaTitle: 'ವಾಕ್ಯ ರಚನೆ - Vaakya Rachane',
  description: 'Master Kannada SOV sentence structure, personal pronouns, common action verbs, and forming questions.',
  displayOrder: 3,
  lessons: [
    {
      id: 'a1-m03-l01',
      moduleId: 'a1-mod-03',
      title: 'Pronouns & Respect Levels (ಸರ್ವನಾಮಗಳು)',
      kannadaTitle: 'ಸರ್ವನಾಮಗಳು: ನಾನು, ನೀವು, ಅವರು',
      description: 'Learn personal pronouns (I, You, He/She/They) and the crucial polite honorifics.',
      estimatedMinutes: 10,
      displayOrder: 1,
      isPublished: true,
      content: {
        introduction:
          'In Kannada, using the appropriate pronoun immediately communicates respect. Kannada distinguishes between informal you (Neenu) and formal/polite you (Neevu).',
        objectives: [
          'Identify personal pronouns (Naanu, Neenu, Neevu, Avaru, Naavu)',
          'Choose the respectful form "Neevu" when speaking to elders, strangers, or professionals',
          'Introduce yourself using "Nanna hesaru..."',
        ],
        vocabulary: [
          { id: 'v3-1', kannada: 'ನಾನು', transliteration: 'Naanu', meaningEn: 'I / Me', meaningNative: { hi: 'मैं', ta: 'நான்', te: 'నేను', ml: 'ഞാൻ' } },
          { id: 'v3-2', kannada: 'ನೀವು', transliteration: 'Neevu', meaningEn: 'You (Polite / Plural)', meaningNative: { hi: 'आप (आदरणीय)', ta: 'நீங்கள்', te: 'మీరు', ml: 'നിങ്ങൾ' } },
          { id: 'v3-3', kannada: 'ನೀನು', transliteration: 'Neenu', meaningEn: 'You (Informal / Close friend)', meaningNative: { hi: 'तू / तुम', ta: 'நீ', te: 'నువ్వు', ml: 'നീ' } },
          { id: 'v3-4', kannada: 'ಅವರು', transliteration: 'Avaru', meaningEn: 'He / She / They (Respectful)', meaningNative: { hi: 'वे / वो (आदरणीय)', ta: 'அவர் / அவர்கள்', te: 'వారు / ఆయన', ml: 'അവർ' } },
          { id: 'v3-5', kannada: 'ನಾವು', transliteration: 'Naavu', meaningEn: 'We / Us', meaningNative: { hi: 'हम', ta: 'நாம் / நாங்கள்', te: 'మేము / మనం', ml: 'ഞങ്ങൾ / നമ്മൾ' } },
          { id: 'v3-6', kannada: 'ನನ್ನ', transliteration: 'Nanna', meaningEn: 'My / Mine', meaningNative: { hi: 'मेरा / मेरी', ta: 'என்னுடைய / என்', te: 'నా / నాది', ml: 'എന്റെ' } },
          { id: 'v3-7', kannada: 'ನಿಮ್ಮ', transliteration: 'Nimma', meaningEn: 'Your / Yours (Polite)', meaningNative: { hi: 'आपका / आपकी', ta: 'உங்களுடைய', te: 'మీ / మీది', ml: 'നിങ്ങളുടെ' } },
          { id: 'v3-8', kannada: 'ಹೆಸರು', transliteration: 'Hesaru', meaningEn: 'Name', meaningNative: { hi: 'नाम', ta: 'பெயர்', te: 'పేరు', ml: 'പേര്' } },
        ],
        grammarTips: [
          {
            title: 'Subject-Object-Verb (SOV) Word Order',
            explanation:
              'Like Hindi, Tamil, Telugu, and Malayalam, Kannada places the verb at the END of the sentence: [Subject] [Object] [Verb].',
            example: 'ನಾನು (I) ಕನ್ನಡ (Kannada) ಕಲಿಯುತ್ತಿದ್ದೇನೆ (am learning).',
            nativeTip: {
              hi: 'हिंदी की तरह ही कन्नड़ में क्रिया हमेशा वाक्य के अंत में आती है।',
              ta: 'தமிழைப் போலவே எழுவாய்-செயப்படுபொருள்-பயனிலை (SOV) வரிசை.',
              te: 'తెలుగు వలెనే కర్త-కర్మ-క్రియ క్రమం.',
              ml: 'മലയാളം പോലെ തന്നെ ക്രിയ അവസാനം വരുന്നു.',
            },
          },
        ],
        examples: [
          {
            id: 'ex3-1',
            kannada: 'ನನ್ನ ಹೆಸರು ರೋಹನ್.',
            transliteration: 'Nanna hesaru Rohan.',
            english: 'My name is Rohan.',
            nativeExplanation: {
              hi: 'मेरा नाम रोहन है।',
              ta: 'என் பெயர் ரோஹன்.',
              te: 'నా పేరు రోహన్.',
              ml: 'എന്റെ പേര് രോഹൻ.',
            },
          },
          {
            id: 'ex3-2',
            kannada: 'ನಿಮ್ಮ ಹೆಸರು ಏನು?',
            transliteration: 'Nimma hesaru yenu?',
            english: 'What is your name? (Polite)',
            nativeExplanation: {
              hi: 'आपका नाम क्या है?',
              ta: 'உங்கள் பெயர் என்ன?',
              te: 'మీ పేరు ఏమిటి?',
              ml: 'നിങ്ങളുടെ പേരെന്താണ്?',
            },
          },
        ],
        completionCriteria: 'Introduce yourself and ask another person\'s name with full polite etiquette.',
      },
    },
    {
      id: 'a1-m03-l02',
      moduleId: 'a1-mod-03',
      title: 'Essential Action Verbs (ಕ್ರಿಯಾಪದಗಳು)',
      kannadaTitle: 'ಮುಖ್ಯ ಕ್ರಿಯಾಪದಗಳು',
      description: 'Learn high-frequency action verbs: do, give, take, go, come, see, and listen.',
      estimatedMinutes: 12,
      displayOrder: 2,
      isPublished: true,
      content: {
        introduction:
          'Verbs power everyday conversations. In Kannada, adding "-i" or "-ri" to a root verb creates an instant polite imperative.',
        objectives: [
          'Recognize common action verbs in spoken Kannada',
          'Use polite commands with shopkeepers, colleagues, and locals',
          'Express simple actions like doing, going, and seeing',
        ],
        vocabulary: [
          { id: 'v3-9', kannada: 'ಮಾಡಿ', transliteration: 'Maadi', meaningEn: 'Please do / make', meaningNative: { hi: 'कीजिए / करो', ta: 'செய்யுங்கள்', te: 'చేయండి', ml: 'ചെയ്യുക / ചെയ്യൂ' } },
          { id: 'v3-10', kannada: 'ಕೊಡಿ', transliteration: 'Kodi', meaningEn: 'Please give', meaningNative: { hi: 'दीजिए', ta: 'கொடுங்கள்', te: 'ఇవ్వండి', ml: 'തരൂ / കൊടുക്കൂ' } },
          { id: 'v3-11', kannada: 'ತಗೊಳ್ಳಿ', transliteration: 'Thagolli', meaningEn: 'Please take', meaningNative: { hi: 'लीजिए', ta: 'எடுத்துக்கொள்ளுங்கள்', te: 'తీసుకోండి', ml: 'എടുക്കൂ' } },
          { id: 'v3-12', kannada: 'ಹೋಗಿ', transliteration: 'Hogi', meaningEn: 'Please go', meaningNative: { hi: 'जाइए', ta: 'போங்கள்', te: 'వెళ్ళండి', ml: 'പോകൂ' } },
          { id: 'v3-13', kannada: 'ನೋಡಿ', transliteration: 'Nodi', meaningEn: 'Please look / see', meaningNative: { hi: 'देखिए', ta: 'பாருங்கள்', te: 'చూడండి', ml: 'നോക്കൂ' } },
          { id: 'v3-14', kannada: 'ಹೇಳಿ', transliteration: 'Heli', meaningEn: 'Please tell / speak', meaningNative: { hi: 'बताइए / बोलिए', ta: 'சொல்லுங்கள்', te: 'చెప్పండి', ml: 'പറയൂ' } },
        ],
        grammarTips: [
          {
            title: 'The Magic of "Heli" (ಹೇಳಿ)',
            explanation:
              'When answering phone calls or attending to someone who approached you, Kannadigas say "Heli sir" or "Heli madam" (meaning "Yes, please tell me / How may I help you?").',
            example: 'ಹೇಳಿ, ಏನು ಬೇಕು? (Heli, yenu beku? - Tell me, what do you need?)',
          },
        ],
        examples: [
          {
            id: 'ex3-3',
            kannada: 'ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡಿ.',
            transliteration: 'Svalpa sahaaya maadi.',
            english: 'Please help me a little.',
            nativeExplanation: {
              hi: 'कृपया थोड़ी मदद कीजिए।',
              ta: 'கொஞ்சம் உதவி செய்யுங்கள்.',
              te: 'కొంచెం సహాయం చేయండి.',
              ml: 'കുറച്ച് സഹായിക്കൂ.',
            },
          },
        ],
        completionCriteria: 'Construct requests with "maadi", "kodi", "hogi", and "heli".',
      },
    },
    {
      id: 'a1-m03-l03',
      moduleId: 'a1-mod-03',
      title: 'Question Words & Yes/No (ಪ್ರಶ್ನೆಗಳು)',
      kannadaTitle: 'ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಉತ್ತರಗಳು',
      description: 'Master the 5 Ws: What, Where, When, Who, Why, How, and answering Yes, No, I Know, I Don\'t Know.',
      estimatedMinutes: 10,
      displayOrder: 3,
      isPublished: true,
      content: {
        introduction:
          'Asking clear questions is the fastest way to get help in Bengaluru and across Karnataka.',
        objectives: [
          'Master question words: Yenu (What), Elli (Where), Yaavaaga (When), Hege (How), Eshtu (How much)',
          'Answer confidently with Haudu (Yes), Illa (No), Gothu (I know), and Gothilla (I don\'t know)',
        ],
        vocabulary: [
          { id: 'v3-15', kannada: 'ಏನು', transliteration: 'Yenu', meaningEn: 'What', meaningNative: { hi: 'क्या', ta: 'என்ன', te: 'ఏమిటి', ml: 'എന്ത്' } },
          { id: 'v3-16', kannada: 'ಎಲ್ಲಿ', transliteration: 'Elli', meaningEn: 'Where', meaningNative: { hi: 'कहाँ', ta: 'எங்கே', te: 'ఎక్కడ', ml: 'എവിടെ' } },
          { id: 'v3-17', kannada: 'ಯಾವಾಗ', transliteration: 'Yaavaaga', meaningEn: 'When', meaningNative: { hi: 'कब', ta: 'எப்போது', te: 'ఎప్పుడు', ml: 'എപ്പോൾ' } },
          { id: 'v3-18', kannada: 'ಹೇಗೆ', transliteration: 'Hege', meaningEn: 'How', meaningNative: { hi: 'कैसे', ta: 'எப்படி', te: 'ఎలా', ml: 'എങ്ങനെ' } },
          { id: 'v3-19', kannada: 'ಎಷ್ಟು', transliteration: 'Eshtu', meaningEn: 'How much / How many', meaningNative: { hi: 'कितना', ta: 'எவ்வளவு', te: 'ఎంత', ml: 'എത്ര' } },
          { id: 'v3-20', kannada: 'ಹೌದು', transliteration: 'Haudu', meaningEn: 'Yes (Affirmative fact)', meaningNative: { hi: 'हाँ', ta: 'ஆம்', te: 'అవును', ml: 'അതെ' } },
          { id: 'v3-21', kannada: 'ಇಲ್ಲ', transliteration: 'Illa', meaningEn: 'No / Not there', meaningNative: { hi: 'नहीं / नहीं है', ta: 'இல்லை', te: 'లేదు / కాదు', ml: 'ഇല്ല' } },
          { id: 'v3-22', kannada: 'ಗೊತ್ತು', transliteration: 'Gothu', meaningEn: 'I know', meaningNative: { hi: 'पता है / जानता हूँ', ta: 'தெரியும்', te: 'తెలుసు', ml: 'അറിയാം' } },
          { id: 'v3-23', kannada: 'ಗೊತ್ತಿಲ್ಲ', transliteration: 'Gothilla', meaningEn: 'I don\'t know', meaningNative: { hi: 'नहीं मालूम / पता नहीं', ta: 'தெரியாது', te: 'తెలియదు', ml: 'അറിയില്ല' } },
        ],
        grammarTips: [
          {
            title: 'Turning Any Statement into a Question (-aa suffix)',
            explanation:
              'In conversational Kannada, add "-aa" to the end of a word or verb to turn it into a yes/no question!',
            example: 'ಇದೆ (Ide - It is there) -> ಇದೆಯಾ? (Ideyaa? - Is it there?)',
          },
        ],
        examples: [
          {
            id: 'ex3-4',
            kannada: 'ಇದು ಎಷ್ಟು?',
            transliteration: 'Idu eshtu?',
            english: 'How much is this?',
            nativeExplanation: {
              hi: 'यह कितने का है?',
              ta: 'இது எவ்வளவு?',
              te: 'ఇది ఎంత?',
              ml: 'ഇതിന് എത്രയാണ്?',
            },
          },
          {
            id: 'ex3-5',
            kannada: 'ನನಗೆ ಕನ್ನಡ ಸ್ವಲ್ಪ ಗೊತ್ತು.',
            transliteration: 'Nanage Kannada svalpa gothu.',
            english: 'I know a little bit of Kannada.',
            nativeExplanation: {
              hi: 'मुझे थोड़ी कन्नड़ आती है।',
              ta: 'எனக்கு கன்னடம் கொஞ்சம் தெரியும்.',
              te: 'నాకు కన్నడ కొంచెం తెలుసు.',
              ml: 'എനിക്ക് കന്നഡ കുറച്ചറിയാം.',
            },
          },
        ],
        completionCriteria: 'Ask how much something costs and tell someone you know a little Kannada.',
      },
    },
  ],
};

