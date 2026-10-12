export type Locale = 'en' | 'hi' | 'ta' | 'ml';

export const dictionaries = {
  en: {
    dashboard: {
      roomMatrix: 'Room Matrix',
      messCounter: 'Live Mess Counter',
      available: 'Available',
      occupied: 'Occupied',
      maintenance: 'Maintenance',
      veg: 'Veg',
      nonVeg: 'Non-Veg',
      skipped: 'Skipped',
    },
    portal: {
      identityPass: 'Digital PG Identity Pass',
      billLedger: 'Live Bill Ledger',
      mealCheckIn: 'Daily Meal Check-in',
      maintenance: 'Maintenance Ticket',
      payNow: 'Pay Now',
      checkInDate: 'Check-in Date',
    },
    common: {
      send: 'Send',
      cancel: 'Cancel',
      loading: 'Loading...',
    },
  },
  hi: {
    dashboard: {
      roomMatrix: 'कक्ष मैट्रिक्स',
      messCounter: 'लाइव मेस काउंटर',
      available: 'उपलब्ध',
      occupied: 'कब्जे में',
      maintenance: 'रखरखाव',
      veg: 'शाकाहारी',
      nonVeg: 'मांसाहारी',
      skipped: 'छोड़ दिया',
    },
    portal: {
      identityPass: 'डिजिटल पीजी पहचान पास',
      billLedger: 'लाइव बिल खाता',
      mealCheckIn: 'दैनिक भोजन चेक-इन',
      maintenance: 'रखरखाव टिकट',
      payNow: 'अभी भुगतान करें',
      checkInDate: 'चेक-इन तिथि',
    },
    common: {
      send: 'प्रस्तुत करें',
      cancel: 'रद्द करें',
      loading: 'लोड हो रहा है...',
    },
  },
  ta: {
    dashboard: {
      roomMatrix: 'அறை மேட்ரிக்ஸ்',
      messCounter: 'நேரடி மெஸ் கவுண்டர்',
      available: 'கிடைக்கிறது',
      occupied: 'ஆக்கிரமிக்கப்பட்டுள்ளது',
      maintenance: 'பராமரிப்பு',
      veg: 'சைவம்',
      nonVeg: 'அசைவம்',
      skipped: 'தவிர்க்கப்பட்டது',
    },
    portal: {
      identityPass: 'டிஜிட்டல் பிஜி அடையாள அட்டை',
      billLedger: 'நேரடி பில் லெட்ஜர்',
      mealCheckIn: 'தினசரி உணவு சரிபார்ப்பு',
      maintenance: 'பராமரிப்பு டிக்கெட்',
      payNow: 'இப்போது செலுத்துங்கள்',
      checkInDate: 'செக்-இன் தேதி',
    },
    common: {
      send: 'சமர்ப்பி',
      cancel: 'ரத்துசெய்',
      loading: 'ஏற்றுகிறது...',
    },
  },
  ml: {
    dashboard: {
      roomMatrix: 'റൂം മാട്രിക്സ്',
      messCounter: 'ലൈവ് മെസ് കൗണ്ടർ',
      available: 'ലഭ്യമാണ്',
      occupied: 'താമസിച്ചിരിക്കുന്നു',
      maintenance: 'അറ്റകുറ്റപ്പണി',
      veg: 'വെജ്',
      nonVeg: 'നോൺ വെജ്',
      skipped: 'ഒഴിവാക്കി',
    },
    portal: {
      identityPass: 'ഡിജിറ്റൽ പിജി ഐഡൻ്റിറ്റി പാസ്',
      billLedger: 'ലൈവ് ബിൽ ലെഡ്ജർ',
      mealCheckIn: 'പ്രതിദിന ഭക്ഷണ ചെക്ക്-ഇൻ',
      maintenance: 'അറ്റകുറ്റപ്പണി ടിക്കറ്റ്',
      payNow: 'ഇപ്പോൾ അടയ്ക്കുക',
      checkInDate: 'ചെക്ക്-ഇൻ തീയതി',
    },
    common: {
      send: 'സമർപ്പിക്കുക',
      cancel: 'റദ്ദാക്കുക',
      loading: 'ലോഡുചെയ്യുന്നു...',
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries['en'];
}
