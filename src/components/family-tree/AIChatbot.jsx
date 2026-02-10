import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  ChevronRight, ExternalLink } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useLanguage } from './LanguageContext';
import ReactMarkdown from 'react-markdown';

export default function AIChatbot({ members, photos, onNavigateToMember, onNavigateToGallery }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('aiGreeting')
      }]);
    }
  }, [isOpen, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildFamilyContext = () => {
    const memberInfo = members.map((m) => {
      const age = m.dateOfBirth ?
      m.isAlive ?
      new Date().getFullYear() - new Date(m.dateOfBirth).getFullYear() :
      m.dateOfDeath ? new Date(m.dateOfDeath).getFullYear() - new Date(m.dateOfBirth).getFullYear() : 'unknown' :
      'unknown';

      const father = m.fatherId ? members.find((p) => p.id === m.fatherId) : null;
      const mother = m.motherId ? members.find((p) => p.id === m.motherId) : null;
      const spouse = m.spouseId ? members.find((s) => s.id === m.spouseId) : null;
      const children = members.filter((c) => c.fatherId === m.id || c.motherId === m.id);

      return `- ${m.firstName} ${m.surname}: Born ${m.dateOfBirth || 'unknown'}${!m.isAlive && m.dateOfDeath ? `, Died ${m.dateOfDeath}` : ''}, Age: ${age}, Status: ${m.isAlive ? 'Alive' : 'Deceased'}${m.birthPlace ? `, Birth Place: ${m.birthPlace}` : ''}${father ? `, Father: ${father.firstName} ${father.surname}` : ''}${mother ? `, Mother: ${mother.firstName} ${mother.surname}` : ''}${spouse ? `, Spouse: ${spouse.firstName} ${spouse.surname}` : ''}${children.length > 0 ? `, Children: ${children.map((c) => `${c.firstName} ${c.surname}`).join(', ')}` : ''}`;
    }).join('\n');

    return `Family Members:\n${memberInfo}\n\nTotal: ${members.length} members, ${members.filter((m) => m.isAlive).length} alive, ${members.filter((m) => !m.isAlive).length} deceased.\n\nPhotos: ${photos.length} photos in gallery.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const familyContext = buildFamilyContext();
    const systemPrompt = `You are a helpful family tree assistant. Answer questions based on the family data provided. Be concise and friendly.

When a user asks about a specific family member, include actionable suggestions like "Would you like me to open their profile?"
When asked about photos, suggest filtering the gallery.
If asked about relationships, trace the family connections.

Current language: ${language === 'en' ? 'English' : 'Polish'}. Respond in the same language.

${familyContext}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser question: ${userMessage}`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          suggestedAction: {
            type: "string",
            enum: ["none", "openProfile", "openGallery"]
          },
          memberName: { type: "string" },
          photoFilter: { type: "string" }
        }
      }
    });

    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: response.answer,
      action: response.suggestedAction,
      memberName: response.memberName,
      photoFilter: response.photoFilter
    }]);
    setIsLoading(false);
  };

  const handleAction = (action, memberName, photoFilter) => {
    if (action === 'openProfile' && memberName) {
      const member = members.find((m) =>
      `${m.firstName} ${m.surname}`.toLowerCase().includes(memberName.toLowerCase()) ||
      m.firstName.toLowerCase() === memberName.toLowerCase()
      );
      if (member) {
        onNavigateToMember(member);
        setIsOpen(false);
      }
    } else if (action === 'openGallery') {
      onNavigateToGallery(photoFilter);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)} className="bg-gradient-to-br text-white rounded-full fixed bottom-6 right-24 z-40 w-14 h-14 from-purple-500 to-indigo-600 shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow">


        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">

            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('aiAssistant')}</h3>
                  <p className="text-xs text-gray-500">Ask about your family</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) =>
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ?
                'bg-emerald-100' :
                'bg-gradient-to-br from-purple-100 to-indigo-100'}`
                }>
                      {msg.role === 'user' ?
                  <User className="w-4 h-4 text-emerald-600" /> :
                  <Bot className="w-4 h-4 text-purple-600" />
                  }
                    </div>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                  msg.role === 'user' ?
                  'bg-emerald-600 text-white' :
                  'bg-gray-100 text-gray-800'}`
                  }>
                        <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Action buttons */}
                      {msg.action && msg.action !== 'none' &&
                  <button
                    onClick={() => handleAction(msg.action, msg.memberName, msg.photoFilter)}
                    className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">

                          <ExternalLink className="w-3 h-3" />
                          {msg.action === 'openProfile' ? 'Open Profile' : 'View Gallery'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                  }
                    </div>
                  </div>
              )}

                {isLoading &&
              <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-100">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  </div>
              }
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('askAboutFamily')}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1" />

                <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700">

                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </>);
