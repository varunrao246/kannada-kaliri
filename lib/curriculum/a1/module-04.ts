/**
 * Module 4: Everyday Conversations (ದೈನಂದಿನ ಸಂಭಾಷಣೆ)
 * Course Level: A1 Beginner
 * Kannada Kaliri
 */

import type { Module } from '@/types/curriculum';

export const module04: Module = {
  id: 'a1-mod-04',
  courseId: 'course-a1-beginner',
  title: 'Everyday Conversations',
  kannadaTitle: 'ದೈನಂದಿನ ಸಂಭಾಷಣೆ',
  description: 'Navigate real Bengaluru situations: hailing an auto, asking directions, shopping at markets, and introducing yourself.',
  displayOrder: 4,
  lessons: [
    {
      id: 'a1-m04-l01',
      moduleId: 'a1-mod-04',
      title: 'Introducing Yourself & Background',
      kannadaTitle: 'ಪರಿಚಯ ಮತ್ತು ವಿವರ',
      description: 'Introduce your name, profession, where you are from, and your enthusiasm for Karnataka.',
      estimatedMinutes: 10,
      displayOrder: 1,
      isPublished: true,
      content: {
        introduction:
          'When meeting new colleagues, neighbors, or Kannada-speaking friends, introducing yourself warmly in Kannada creates an immediate positive impression.',
        objectives: [
          'State where you are from and where you live currently in Karnataka',
          'Mention your work or studies in conversational Kannada',
          'Express that you are excited to learn Kannada',
        ],
        vocabulary: [
          { id: 'v4-1', kannada: 'ಊರು', transliteration: 'Ooru', meaningEn: 'Native town / City', meaningNative: { hi: 'गृहनगर / शहर', ta: 'ஊர்', te: 'ఊరు', ml: 'നാട് / ഊര്' } },
          { id: 'v4-2', kannada: 'ಕೆಲಸ', transliteration: 'Kelasa', meaningEn: 'Work / Job', meaningNative: { hi: 'काम / नौकरी', ta: 'வேலை', te: 'పని', ml: 'ജോലി / പണി' } },
          { id: 'v4-3', kannada: 'ಕಲಿಯುತ್ತಿದ್ದೇನೆ', transliteration: 'Kaliyutthiddene', meaningEn: 'I am learning', meaningNative: { hi: 'मैं सीख रहा हूँ', ta: 'நான் கற்கிறேன்', te: 'నేను నేర్చుకుంటున్నాను', ml: 'ഞാൻ പഠിക്കുന്നു' } },
          { id: 'v4-4', kannada: 'ಖುಷಿ', transliteration: 'Khushi', meaningEn: 'Happiness / Pleasure', meaningNative: { hi: 'ख़ुशी', ta: 'மகிழ்ச்சி', te: 'సంతోషం', ml: 'സന്തോഷം' } },
        ],
        grammarTips: [
          {
            title: 'Expressing Origin: "ನಾನು ... ಇಂದ ಬಂದಿದ್ದೀನಿ" (Naanu ... inda bandiddini)',
            explanation:
              'The suffix "-inda" means "from". So say "[City] inda" to say where you came from.',
            example: 'ನಾನು ದೆಹಲಿಯಿಂದ ಬಂದಿದ್ದೀನಿ (Naanu Delhiyinda bandiddini - I have come from Delhi).',
          },
        ],
        examples: [
          {
            id: 'ex4-1',
            kannada: 'ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ಇಂಜಿನಿಯರ್ ಆಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇನೆ.',
            transliteration: 'Naanu Bengalurinalli engineer aagi kelasa maadutthiddene.',
            english: 'I am working as an engineer in Bengaluru.',
            nativeExplanation: {
              hi: 'मैं बेंगलुरु में इंजीनियर के रूप में काम कर रहा हूँ।',
              ta: 'நான் பெங்களூரில் பொறியியலாளராக பணிபுரிகிறேன்.',
              te: 'నేను బెంగళూరులో ఇంజనీర్ గా పనిచేస్తున్నాను.',
              ml: 'ഞാൻ ബാംഗ്ലൂരിൽ എഞ്ചിനീയറായി ജോലി ചെയ്യുന്നു.',
            },
          },
          {
            id: 'ex4-2',
            kannada: 'ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿದ್ದು ತುಂಬಾ ಖುಷಿಯಾಯಿತು.',
            transliteration: 'Nimmannu bhetiyaagiddu thumba khushiyaayithu.',
            english: 'It was very nice to meet you.',
            nativeExplanation: {
              hi: 'आपसे मिलकर बहुत खुशी हुई।',
              ta: 'உங்களை சந்தித்ததில் மிக்க மகிழ்ச்சி.',
              te: 'మిమ్మల్ని కలవడం చాలా సంతోషంగా ఉంది.',
              ml: 'അങ്ങയെ കണ്ടുമുട്ടിയതിൽ വളരെ സന്തോഷം.',
            },
          },
        ],
        completionCriteria: 'Say where you live, what you do, and state that you are learning Kannada.',
      },
    },
    {
      id: 'a1-m04-l02',
      moduleId: 'a1-mod-04',
      title: 'Bangalore Auto-Rickshaw Conversations',
      kannadaTitle: 'ಆಟೋ ಚಾಲಕರೊಂದಿಗೆ ಸಂಭಾಷಣೆ',
      description: 'Ask autos to go by meter, state destinations, ask price, and give navigation directions.',
      estimatedMinutes: 10,
      displayOrder: 2,
      isPublished: true,
      content: {
        introduction:
          'Taking an auto in Bengaluru is a rite of passage! With a few respectful Kannada phrases, auto drivers will appreciate your effort and treat you like family.',
        objectives: [
          'Ask if the auto will go to your destination respectfully ("Hogteera?")',
          'Request meter usage politely ("Meter haaki anna")',
          'Give turn-by-turn directions ("Neravaagi", "Yeda", "Bala")',
        ],
        vocabulary: [
          { id: 'v4-5', kannada: 'ಹೋಗ್ತೀರಾ?', transliteration: 'Hogteera?', meaningEn: 'Will you go? (Polite question)', meaningNative: { hi: 'चलेंगे क्या?', ta: 'போவீர்களா?', te: 'వెళ్తారా?', ml: 'പോകുമോ?' } },
          { id: 'v4-6', kannada: 'ಮೀಟರ್ ಹಾಕಿ ಅಣ್ಣಾ', transliteration: 'Meter haaki anna', meaningEn: 'Please put the meter, brother', meaningNative: { hi: 'भैया मीटर लगाइए', ta: 'அண்ணா மீட்டர் போடுங்கள்', te: 'అన్నా మీటర్ వేయండి', ml: 'ചേട്ടാ മീറ്റർ ഇടൂ' } },
          { id: 'v4-7', kannada: 'ನೇರವಾಗಿ', transliteration: 'Neravaagi', meaningEn: 'Straight ahead', meaningNative: { hi: 'सीधे', ta: 'நேராக', te: 'నేరుగా / తిన్నగా', ml: 'നേരെ' } },
          { id: 'v4-8', kannada: 'ಎಡಕ್ಕೆ', transliteration: 'Yedakke', meaningEn: 'To the left', meaningNative: { hi: 'बाएँ', ta: 'இடப்பக்கம்', te: 'ఎడమవైపు', ml: 'ഇടത്തോട്ട്' } },
          { id: 'v4-9', kannada: 'ಬಲಕ್ಕೆ', transliteration: 'Balakke', meaningEn: 'To the right', meaningNative: { hi: 'दाएँ', ta: 'வலப்பக்கம்', te: 'కుడివైపు', ml: 'വലത്തോട്ട്' } },
          { id: 'v4-10', kannada: 'ಇಲ್ಲೇ ನಿಲ್ಲಿಸಿ', transliteration: 'Ille nillisi', meaningEn: 'Stop right here, please', meaningNative: { hi: 'यहीं रोकिए', ta: 'இங்கேயே நிறுத்துங்கள்', te: 'ఇక్కడే ఆపండి', ml: 'ഇവിടെ നിർത്തൂ' } },
        ],
        grammarTips: [
          {
            title: 'Respectful Address: "ಅಣ್ಣಾ" (Anna)',
            explanation:
              'In Karnataka, addressing men as "Anna" (Elder brother) or women as "Akka" (Elder sister) is culturally universal and warmly welcomed across all daily encounters.',
          },
        ],
        examples: [
          {
            id: 'ex4-3',
            kannada: 'ಅಣ್ಣಾ, ಇಂದಿರಾನಗರ 100 ಫೀಟ್ ರೋಡ್‌ಗೆ ಹೋಗ್ತೀರಾ?',
            transliteration: 'Anna, Indiranagara 100 feet road-ge hogteera?',
            english: 'Brother, will you go to Indiranagar 100ft road?',
            nativeExplanation: {
              hi: 'भैया, क्या आप इंदिरानगर 100 फीट रोड चलेंगे?',
              ta: 'அண்ணா, இந்திராநகர் 100 அடி சாலைக்கு போவீர்களா?',
              te: 'అన్నా, ఇందిరానగర్ 100 ఫీట్ రోడ్ కి వెళ్తారా?',
              ml: 'ചേട്ടാ, ഇന്ദിരാനഗർ 100 ഫീറ്റ് റോഡിലേക്ക് പോകുമോ?',
            },
          },
          {
            id: 'ex4-4',
            kannada: 'ಮುಂದೆ ಸಿಗ್ನಲ್ ಹತ್ತಿರ ಎಡಕ್ಕೆ ಹೋಗಿ, ಆಮೇಲೆ ನಿಲ್ಲಿಸಿ.',
            transliteration: 'Munde signal hatthira yedakke hogi, aamele nillisi.',
            english: 'Go left near the signal ahead, then please stop.',
            nativeExplanation: {
              hi: 'आगे सिग्नल के पास बाएँ जाइए, फिर रोकिए।',
              ta: 'முன்னால் சிக்னல் அருகில் இடதுபுறம் செல்லுங்கள், பிறகு நிறுத்துங்கள்.',
              te: 'ముందు సిగ్నల్ దగ్గర ఎడమవైపు వెళ్ళండి, తర్వాత ఆపండి.',
              ml: 'മുന്നിലെ സിഗ്നലിനടുത്ത് ഇടത്തോട്ട് പോകുക, പിന്നെ നിർത്തുക.',
            },
          },
        ],
        completionCriteria: 'Engage in a complete auto hailing and drop dialogue with directions.',
      },
    },
    {
      id: 'a1-m04-l03',
      moduleId: 'a1-mod-04',
      title: 'Shopping & Asking Prices in Local Markets',
      kannadaTitle: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಖರೀದಿ',
      description: 'Buy fruits, vegetables, groceries, and ask prices politely at KR Market, Russell Market, or local Kirana stores.',
      estimatedMinutes: 10,
      displayOrder: 3,
      isPublished: true,
      content: {
        introduction:
          'From KR Market flower bazaars to Malleshwaram fruit vendors, speaking Kannada gets you the freshest produce and warmest smiles.',
        objectives: [
          'Ask the price of fruits and vegetables per kilogram',
          'Request polite discounts ("Svalpa kadime maadi")',
          'Confirm payment via UPI / cash',
        ],
        vocabulary: [
          { id: 'v4-11', kannada: 'ಕೆ.ಜಿ.ಗೆ ಎಷ್ಟು?', transliteration: 'KG-ge eshtu?', meaningEn: 'How much per kilogram?', meaningNative: { hi: 'किलो का कितना?', ta: 'கிலோவுக்கு எவ்வளவு?', te: 'కిలోకి ఎంత?', ml: 'കിലോയ്ക്ക് എത്രയാണ്?' } },
          { id: 'v4-12', kannada: 'ಹಣ್ಣು', transliteration: 'Hannu', meaningEn: 'Fruit', meaningNative: { hi: 'फल', ta: 'பழம்', te: 'పండు', ml: 'പഴം' } },
          { id: 'v4-13', kannada: 'ತರಕಾರಿ', transliteration: 'Tharakaari', meaningEn: 'Vegetables', meaningNative: { hi: 'सब्ज़ी', ta: 'காய்கறி', te: 'కూరగాయలు', ml: 'പച്ചക്കറി' } },
          { id: 'v4-14', kannada: 'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ ಅಣ್ಣಾ', transliteration: 'Svalpa kadime maadi anna', meaningEn: 'Please reduce the price a little, brother', meaningNative: { hi: 'भैया थोड़ा कम कीजिए', ta: 'அண்ணா கொஞ்சம் குறைத்து வையுங்கள்', te: 'అన్నా కొంచెం తగ్గించండి', ml: 'ചേട്ടാ കുറച്ച് കുറയ്ക്കൂ' } },
          { id: 'v4-15', kannada: 'ಆನ್‌ಲೈನ್ ಪೇಮೆಂಟ್ ಇದೆಯಾ?', transliteration: 'Online payment ideya?', meaningEn: 'Do you have online payment / UPI?', meaningNative: { hi: 'क्या ऑनलाइन पेमेंट है?', ta: 'ஆன்லைன் பேமெண்ட் இருக்கிறதா?', te: 'ఆన్‌లైన్ పేమెంట్ ఉందా?', ml: 'ഓൺലൈൻ പേയ്‌മെന്റ് ഉണ്ടോ?' } },
        ],
        grammarTips: [
          {
            title: 'The Dative Suffix: "-ge" (ಗೆ)',
            explanation:
              'In Kannada, adding "-ge" to a noun means "to" or "for". For example, "KG-ge" means "for a KG", "Namage" means "for us / to me".',
            example: 'ಟೊಮೆಟೊ ಕೆ.ಜಿ.ಗೆ ಎಷ್ಟು? (Tomato KG-ge eshtu? - How much for a kg of tomatoes?)',
          },
        ],
        examples: [
          {
            id: 'ex4-5',
            kannada: 'ಒಂದು ಕೆ.ಜಿ ಸೇಬು ಕೊಡಿ. ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡ್ತೀನಿ.',
            transliteration: 'Ondu KG seebu kodi. QR code scan maadtheeni.',
            english: 'Please give one kg apples. I will scan the QR code.',
            nativeExplanation: {
              hi: 'एक किलो सेब दीजिए। मैं क्यूआर कोड स्कैन करता हूँ।',
              ta: 'ஒரு கிலோ ஆப்பிள் கொடுங்கள். நான் க்யூஆர் கோட் ஸ்கேன் செய்கிறேன்.',
              te: 'ఒక కేజీ యాపిల్స్ ఇవ్వండి. నేను క్యూఆర్ కోడ్ స్కాన్ చేస్తాను.',
              ml: 'ഒരു കിലോ ആപ്പിൾ തരൂ. ഞാൻ ക്യുആർ കോഡ് സ്കാൻ ചെയ്യാം.',
            },
          },
        ],
        completionCriteria: 'Inquire about vegetable/fruit prices, negotiate politely, and pay via QR code.',
      },
    },
  ],
};

