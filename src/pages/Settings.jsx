import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, BookOpen, Shield, Sun, Moon, Languages, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import EmeraldButton from '@/components/ui/EmeraldButton';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function Settings() {
  const handleLogout = () => {
    base44.auth.logout('/');
  };
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, languages } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <GoldHeading size="md">Settings</GoldHeading>
      </div>

      <div className="space-y-3">
        <GlassCard delay={0} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <h3 className="font-heading text-base text-foreground">Appearance</h3>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-7 w-13 items-center rounded-full border border-border bg-muted transition-colors focus:outline-none"
              style={{ width: '52px' }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-primary transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <p className="text-muted-foreground text-xs mt-2">
            {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
          </p>
        </GlassCard>

        <GlassCard delay={0.01} className="p-4">
          <button
            onClick={() => setShowLangPicker(p => !p)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-primary" />
              <h3 className="font-heading text-base text-foreground">Language</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.label}
            </span>
          </button>
          {showLangPicker && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang.code); setShowLangPicker(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    language === lang.code
                      ? 'bg-primary/15 border border-primary/40 text-foreground'
                      : 'bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="font-body">{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.02} className="p-4">
          <h3 className="font-heading text-base text-foreground mb-1">About</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            The Divine Bratan is a sacred literature archive. Our AI chatbot answers only from archived sources
            and cites every claim. We do not hallucinate or invent references.
          </p>
        </GlassCard>

        <GlassCard delay={0.05} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-base text-foreground">Citation Policy</h3>
          </div>
          <ul className="text-muted-foreground text-xs space-y-1.5 leading-relaxed">
            <li>• Every answer cites exact book, chapter, and verse</li>
            <li>• If evidence is insufficient, the bot refuses to guess</li>
            <li>• No medical, legal, or dangerous claims are made</li>
            <li>• All traditions are treated with equal respect</li>
          </ul>
        </GlassCard>

        <GlassCard delay={0.1} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-base text-foreground">Included Texts</h3>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            The archive currently includes public domain texts from the Bhagavad Gita, 
            King James Bible, Dhammapada, and Tao Te Ching. More texts are added regularly.
          </p>
        </GlassCard>

        <GlassCard delay={0.12} className="p-4">
          <Link to="/archive-admin" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="font-heading text-base text-foreground">Archive Admin</h3>
            </div>
            <span className="text-muted-foreground text-xs">Import 75+ books →</span>
          </Link>
        </GlassCard>

        <div className="pt-4">
          <EmeraldButton
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </EmeraldButton>
        </div>
      </div>
    </PageContainer>
  );
}