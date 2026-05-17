import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import { searchArchive, generateGroundedAnswer } from '@/lib/ragService';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text) => {
    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Create thread if needed
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await base44.entities.ChatThread.create({
        title: text.substring(0, 80),
        message_count: 0
      });
      currentThreadId = thread.id;
      setThreadId(currentThreadId);
    }

    // Save user message
    await base44.entities.ChatMessage.create({
      thread_id: currentThreadId,
      role: 'user',
      content: text
    });

    // RAG: search archive
    const retrievedSections = await searchArchive(text);
    
    // Generate grounded answer
    const response = await generateGroundedAnswer(text, retrievedSections);

    // Map citations back with tradition info
    const citationsWithMeta = (response.citations || []).map(cite => {
      const sourceSection = retrievedSections[cite.source_index - 1];
      return {
        book_title: cite.book_title || sourceSection?.book_title || '',
        chapter: cite.chapter || '',
        verse: cite.verse || sourceSection?.verse_reference || '',
        quote: cite.quote || '',
        tradition: sourceSection?.tradition || '',
        section_id: sourceSection?.id || ''
      };
    });

    const assistantMsg = {
      role: 'assistant',
      content: response.answer,
      citations: citationsWithMeta,
      confidence: response.confidence
    };

    setMessages(prev => [...prev, assistantMsg]);

    // Save assistant message
    await base44.entities.ChatMessage.create({
      thread_id: currentThreadId,
      role: 'assistant',
      content: response.answer,
      citations: citationsWithMeta,
      confidence: response.confidence
    });

    // Update thread
    await base44.entities.ChatThread.update(currentThreadId, {
      last_message_preview: response.answer.substring(0, 100),
      message_count: messages.length + 2
    });

    queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/30 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-base text-foreground">Ask the Bratan</h2>
              <p className="text-xs text-muted-foreground">Grounded in the archive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-foreground/50 text-sm font-heading italic">
              Ask about any tradition, scripture, or teaching
            </p>
            <p className="text-muted-foreground/40 text-xs mt-2">
              All answers cite exact sources from the archive
            </p>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground text-sm ml-11"
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">Searching the archive...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} loading={loading} />
    </div>
  );
}