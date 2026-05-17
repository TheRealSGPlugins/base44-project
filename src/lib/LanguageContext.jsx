import React, { createContext, useContext, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { code: 'si', label: 'සිංහල', flag: '🇱🇰' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', label: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'zu', label: 'isiZulu', flag: '🇿🇦' },
  { code: 'af', label: 'Afrikaans', flag: '🇿🇦' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
  { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', label: 'Српски', flag: '🇷🇸' },
  { code: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', label: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', label: 'Eesti', flag: '🇪🇪' },
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', label: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
  { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
  { code: 'my', label: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'km', label: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', label: 'ລາວ', flag: '🇱🇦' },
  { code: 'bo', label: 'བོད་སྐད།', flag: '🏔️' },
  { code: 'sa', label: 'संस्कृतम्', flag: '🕉️' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(code) ? 'rtl' : 'ltr';
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, currentLang, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}