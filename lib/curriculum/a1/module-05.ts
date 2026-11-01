/**
 * Module 5: Karnataka Life (ಕರ್ನಾಟಕ ಜೀವನ)
 * Course Level: A1 Beginner
 * Kannada Kaliri
 */

import type { Module } from '@/types/curriculum';

export const module05: Module = {
  id: 'a1-mod-05',
  courseId: 'course-a1-beginner',
  title: 'Karnataka Life & Culture',
  kannadaTitle: 'ಕರ್ನಾಟಕ ಜೀವನ ಮತ್ತು ಸಂಸ್ಕೃತಿ',
  description: 'Understand vibrant Bengaluru slang, navigate BMTC & Namma Metro, thrive in the workplace, and celebrate Karnataka festivals.',
  displayOrder: 5,
  lessons: [
    {
      id: 'a1-m05-l01',
      moduleId: 'a1-mod-05',
      title: 'Popular Bengaluru Expressions & Friendly Slang',
      kannadaTitle: 'ಬೆಂಗಳೂರು ಮಾತು ಮತ್ತು ನುಡಿಗಟ್ಟುಗಳು',
      description: 'Decode the most loved local expressions: "Sakath", "Maga", "Guru", "Adjust maadi", and "Aaraama?".',
      estimatedMinutes: 8,
      displayOrder: 1,
      isPublished: true,
      content: {
        introduction:
          'Bengaluru has its own unique, affectionate conversational rhythm. Understanding these phrases gives you an insider badge to conversations with college friends and colleagues.',
        objectives: [
          'Use positive local descriptors like "Sakath" (Awesome / Superb)',
          'Understand friendly terms like "Guru", "Maga", and "Boss"',
          'Recognize classic Bengaluru cultural mantras like "Adjust maadi"',
        ],
        vocabulary: [
          { id: 'v5-1', kannada: 'ಸಖತ್', transliteration: 'Sakath', meaningEn: 'Awesome / Amazing / Superb', meaningNative: { hi: 'ज़बरदस्त / बहुत बढ़िया', ta: 'செம்ம / அருமை', te: 'సూపర్ / అదిరిపోయింది', ml: 'പൊളി / കൊള്ളാം' } },
          { id: 'v5-2', kannada: 'ಗುರು', transliteration: 'Guru', meaningEn: 'Buddy / Friend / Guide (Affectionate)', meaningNative: { hi: 'दोस्त / उस्ताद', ta: 'நண்பா / பாஸ்', te: 'గురువు / బ్రదర్', ml: 'ചങ്ങാതി / ഭായ്' } },
          { id: 'v5-3', kannada: 'ಅಡ್ಜಸ್ಟ್ ಮಾಡಿ', transliteration: 'Adjust maadi', meaningEn: 'Please adjust a little (The Bangalore cooperative spirit)', meaningNative: { hi: 'थोड़ा एडजस्ट कर लीजिए', ta: 'கொஞ்சம் அட்ஜஸ்ட் பண்ணுங்க', te: 'కొంచెం అడ్జస్ట్ చేయండి', ml: 'കുറച്ച് അഡ്ജസ്റ്റ് ചെയ്യൂ' }, culturalNote: 'The universal Bengaluru motto for sharing space, seats, and navigating busy city life.' },
          { id: 'v5-4', kannada: 'ಆರಾಮಾಗಿರಿ', transliteration: 'Aaraamaagiri', meaningEn: 'Take it easy / Relax / Be comfortable', meaningNative: { hi: 'आराम से रहिए / तसल्ली रखिए', ta: 'ஆறுதலாக இருங்கள்', te: 'నిమ్మళంగా ఉండండి', ml: 'റിലാക്സ് ചെയ്യൂ' } },
        ],
        grammarTips: [
          {
            title: 'Friendly vs Professional Boundaries',
            explanation:
              'While "Guru" and "Maga" are popular among close friends and college peers, use "Sir", "Madam", or "Anna" in formal or professional interactions.',
          },
        ],
        examples: [
          {
            id: 'ex5-1',
            kannada: 'ಕಾಫಿ ಸಖತ್ ಆಗಿದೆ ಗುರು!',
            transliteration: 'Coffee sakath aagide guru!',
            english: 'The coffee is awesome, buddy!',
            nativeExplanation: {
              hi: 'कॉफ़ी ज़बरदस्त बनी है दोस्त!',
              ta: 'காபி செம்மையா இருக்கு பாஸ்!',
              te: 'కాఫీ చాలా బాగుంది గురూ!',
              ml: 'കോഫി പൊളിയാണ് ഭായ്!',
            },
          },
        ],
        completionCriteria: 'Use "sakath" and "aaraamaagiri" appropriately in friendly dialogue.',
      },
    },
    {
      id: 'a1-m05-l02',
      moduleId: 'a1-mod-05',
      title: 'Navigating BMTC Buses & Namma Metro',
      kannadaTitle: 'ಸಾರಿಗೆ: ಬಿಎಂಟಿಸಿ ಮತ್ತು ನಮ್ಮ ಮೆಟ್ರೋ',
      description: 'Buy tickets, find platform directions, ask bus stops, and travel smoothly across Karnataka cities.',
      estimatedMinutes: 10,
      displayOrder: 2,
      isPublished: true,
      content: {
        introduction:
          'With millions riding BMTC buses and the purple/green lines of Namma Metro daily, transit Kannada gets you to your destination stress-free.',
        objectives: [
          'Ask the conductor if a bus stops at your stop ("Stop ideyaa?")',
          'Ask for tickets to a destination ("Majestic-ge ondu ticket kodi")',
          'Identify station announcements and platform signs',
        ],
        vocabulary: [
          { id: 'v5-5', kannada: 'ನಿಲ್ದಾಣ', transliteration: 'Nildaana', meaningEn: 'Bus stop / Station', meaningNative: { hi: 'स्टॉप / स्टेशन', ta: 'நிலையம் / நிறுத்தம்', te: 'స్టేషన్ / ఆగమస్థలం', ml: 'സ്റ്റോപ്പ് / നിലയം' } },
          { id: 'v5-6', kannada: 'ಮುಂದಿನ ಸ್ಟಾಪ್ ಯಾವುದು?', transliteration: 'Mundina stop yaavudu?', meaningEn: 'Which is the next stop?', meaningNative: { hi: 'अगला स्टॉप कौन सा है?', ta: 'அடுத்த நிறுத்தம் எது?', te: 'తర్వాతి స్టాప్ ఏది?', ml: 'അടുത്ത സ്റ്റോപ്പ് ഏതാണ്?' } },
          { id: 'v5-7', kannada: 'ಚಿಲ್ಲರೆ ಇದೆಯಾ?', transliteration: 'Chillare ideya?', meaningEn: 'Do you have change (loose coins/cash)?', meaningNative: { hi: 'क्या छुट्टा (चिल्लर) है?', ta: 'சில்லறை இருக்கிறதா?', te: 'చిల్లర ఉందా?', ml: 'ചില്ലറയുണ്ടോ?' } },
        ],
        grammarTips: [
          {
            title: 'Expressing "Next": ಮುಂದಿನ (Mundina)',
            explanation:
              'The word "Munde" means "ahead / next". Add "-ina" to describe the upcoming item, such as "Mundina stop" (next stop) or "Mundina vaara" (next week).',
          },
        ],
        examples: [
          {
            id: 'ex5-2',
            kannada: 'ಕಂಡಕ್ಟರ್ ಸರ್, ಮೆಜೆಸ್ಟಿಕ್‌ಗೆ ಒಂದು ಟಿಕೆಟ್ ಕೊಡಿ.',
            transliteration: 'Conductor sir, Majestic-ge ondu ticket kodi.',
            english: 'Conductor sir, please give one ticket to Majestic.',
            nativeExplanation: {
              hi: 'कंडक्टर सर, मैजेस्टिक का एक टिकट दीजिए।',
              ta: 'கண்டக்டர் சார், மெஜஸ்டிக்கிற்கு ஒரு டிக்கெட் கொடுங்கள்.',
              te: 'కండక్టర్ సర్, మెజెస్టిక్ కి ఒక టికెట్ ఇవ్వండి.',
              ml: 'കണ്ടക്ടർ സാർ, മജെസ്റ്റിക്കിലേക്ക് ഒരു ടിക്കറ്റ് തരൂ.',
            },
          },
        ],
        completionCriteria: 'Ask for a bus/metro ticket and ask which is the upcoming stop.',
      },
    },
    {
      id: 'a1-m05-l03',
      moduleId: 'a1-mod-05',
      title: 'Workplace Etiquette & Cultural Pride',
      kannadaTitle: 'ಕಚೇರಿ ಮತ್ತು ಕರ್ನಾಟಕ ಸಂಸ್ಕೃತಿ',
      description: 'Polite office banter with colleagues, wishing on festivals (Dasara, Rajyotsava), and building lifelong connections.',
      estimatedMinutes: 10,
      displayOrder: 3,
      isPublished: true,
      content: {
        introduction:
          'Speaking a few sentences in Kannada at your Bengaluru office or startup immediately signals cultural respect, warmth, and inclusion.',
        objectives: [
          'Wish colleagues "Shubhodaya" (Good morning) and "Shubhadina" (Good day)',
          'Wish people on Karnataka Rajyotsava (Nov 1st) and Mysuru Dasara',
          'Express gratitude for guidance and collaboration',
        ],
        vocabulary: [
          { id: 'v5-8', kannada: 'ಶುಭೋದಯ', transliteration: 'Shubhodaya', meaningEn: 'Good morning', meaningNative: { hi: 'शुभ प्रभात', ta: 'காலை வணக்கம்', te: 'శుభోదయం', ml: 'സുപ്രഭാതം' } },
          { id: 'v5-9', kannada: 'ಶುಭ ಸಂಜೆ', transliteration: 'Shubha sanje', meaningEn: 'Good evening', meaningNative: { hi: 'शुभ संध्या', ta: 'மாலை வணக்கம்', te: 'శుభ సాయంత్రం', ml: 'ശുഭ സായാഹ്നം' } },
          { id: 'v5-10', kannada: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವದ ಶುಭಾಶಯಗಳು', transliteration: 'Kannada Rajyotsavada shubhaashayagalu', meaningEn: 'Happy Karnataka Rajyotsava (Karnataka Formation Day)', meaningNative: { hi: 'कन्नड़ राज्योत्सव की हार्दिक शुभकामनाएँ', ta: 'கன்னட ராஜ்யோத்சவ வாழ்த்துகள்', te: 'కన్నడ రాజ్యోత్సవ శుభాకాంక్షలు', ml: 'കന്നഡ രാജ്യോത്സവ ആശംസകൾ' }, culturalNote: 'Celebrated every year on November 1st across the state with red-and-yellow flags and musical events.' },
          { id: 'v5-11', kannada: 'ದಸರಾ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು', transliteration: 'Dasara habbada shubhaashayagalu', meaningEn: 'Happy Dasara Festival greetings', meaningNative: { hi: 'दशहरा पर्व की शुभकामनाएँ', ta: 'தசரா திருநாள் வாழ்த்துகள்', te: 'దసరా పండుగ శుభాకాంక్షలు', ml: 'ദസറ ഉത്സവ ആശംസകൾ' } },
        ],
        grammarTips: [
          {
            title: 'Greeting on Festivals: "... ಶುಭಾಶಯಗಳು" (... shubhaashayagalu)',
            explanation:
              'To wish anyone on any festival or birthday, add "shubhaashayagalu" (Best wishes / congratulations).',
            example: 'ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು (Huttu habbada shubhaashayagalu - Happy Birthday!)',
          },
        ],
        examples: [
          {
            id: 'ex5-3',
            kannada: 'ಎಲ್ಲರಿಗೂ ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು!',
            transliteration: 'Ellarigoo Kannada Rajyotsavada haardika shubhaashayagalu!',
            english: 'Hearty Karnataka Rajyotsava wishes to everyone!',
            nativeExplanation: {
              hi: 'सभी को कन्नड़ राज्योत्सव की हार्दिक शुभकामनाएँ!',
              ta: 'அனைவருக்கும் கன்னட ராஜ்யோத்சவ நல்வாழ்த்துகள்!',
              te: 'అందరికీ కన్నడ రాజ్యోత్సవ హార్ధిక శుభాకాంక్షలు!',
              ml: 'എല്ലാവർക്കും കന്നഡ രാജ്യോത്സവത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!',
            },
          },
        ],
        completionCriteria: 'Greet colleagues in morning/evening and offer festival greetings gracefully.',
      },
    },
  ],
};

