import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, MessageCircle, Sparkles } from 'lucide-react';
import EmeraldButton from '@/components/ui/EmeraldButton';
import GoldHeading from '@/components/ui/GoldHeading';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center font-body">
      {/* Decorative ornament */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GoldHeading size="2xl" className="mb-2">
          The Divine Bratan
        </GoldHeading>
        <p className="text-muted-foreground font-heading text-lg italic mb-8">
          Stillness Archive
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-foreground/70 text-sm leading-relaxed max-w-xs mb-12"
      >
        A sacred archive of religious and spiritual literature from many traditions.
        Browse, search, and explore with a truthful AI guide that cites its sources.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <Link to="/home">
          <EmeraldButton className="w-full py-4 text-base">
            <BookOpen className="w-5 h-5" />
            Start Reading
          </EmeraldButton>
        </Link>
        <Link to="/chat">
          <EmeraldButton variant="outline" className="w-full py-4 text-base">
            <MessageCircle className="w-5 h-5" />
            Ask the Archive
          </EmeraldButton>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-16 text-muted-foreground/40 text-xs"
      >
        All citations grounded in archived sources
      </motion.div>
    </div>
  );
}