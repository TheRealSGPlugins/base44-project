import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Library, Compass, History, Settings } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import HomeMenuCard from '@/components/cards/HomeMenuCard';

const menuItems = [
  {
    icon: MessageCircle,
    title: 'Ask the Bratan',
    subtitle: 'Truthful answers from the archive',
    to: '/chat',
    accentColor: 'bg-accent/15'
  },
  {
    icon: Library,
    title: 'Sacred Library',
    subtitle: 'Browse all traditions',
    to: '/library',
    accentColor: 'bg-primary/10'
  },
  {
    icon: Compass,
    title: 'Stillness Guide',
    subtitle: 'Meditation & contemplation',
    to: '/library?category=meditation',
    accentColor: 'bg-accent/10'
  },
  {
    icon: History,
    title: 'My History',
    subtitle: 'Past questions & bookmarks',
    to: '/history',
    accentColor: 'bg-muted'
  },
  {
    icon: Settings,
    title: 'Settings',
    subtitle: 'Preferences & account',
    to: '/settings',
    accentColor: 'bg-muted'
  }
];

export default function Home() {
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <GoldHeading size="xl">The Divine Bratan</GoldHeading>
        <p className="text-muted-foreground text-sm mt-1 font-heading italic">
          Stillness Archive
        </p>
      </motion.div>

      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <HomeMenuCard
            key={item.to}
            {...item}
            delay={i * 0.08}
          />
        ))}
      </div>
    </PageContainer>
  );
}