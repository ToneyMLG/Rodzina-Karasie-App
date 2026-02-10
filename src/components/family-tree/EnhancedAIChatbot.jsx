import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronRight, ExternalLink, Image as ImageIcon, Mic, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useLanguage } from './LanguageContext';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';

// Audio buffer to WAV conversion helper
function audioBufferToWav(buffer) {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      data.push(int16);
    }
  }

  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true);
    offset += 2;
  }

  return arrayBuffer;
}

export default function EnhancedAIChatbot({ members, photos, onNavigateToMember, onNavigateToGallery }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const scrollRef = useRef(null);

  // Load knowledge base
  const { data: knowledgeDocs } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: () => base44.entities.KnowledgeDocument.list()
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Witaj! Jestem asystentem rodziny. Mogę odpowiadać na pytania o twoją rodzinę. Możesz też dodać zdjęcia lub nagrać wiadomość głosową.'
      }]);
    }
  }, [isOpen]);

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
          m.dateOfDeath ? new Date(m.dateOfDeath).getFullYear() - new Date(m.dateOfBirth).getFullYear() : 'nieznany' :
        'nieznany';

      const father = m.fatherId ? members.find((p) => p.id === m.fatherId) : null;
      const mother = m.motherId ? members.find((p) => p.id === m.motherId) : null;
      const spouse = m.spouseId ? members.find((s) => s.id === m.spouseId) : null;
      const children = members.filter((c) => c.fatherId === m.id || c.motherId === m.id);

      return `- ${m.firstName} ${m.surname}: Urodzony ${m.dateOfBirth || 'nieznana'}${!m.isAlive && m.dateOfDeath ? `, Zmarł ${m.dateOfDeath}` : ''}, Wiek: ${age}, Status: ${m.isAlive ? 'Żyje' : 'Zmarły'}${m.birthPlace ? `, Miejsce urodzenia: ${m.birthPlace}` : ''}${father ? `, Ojciec: ${father.firstName} ${father.surname}` : ''}${mother ? `, Matka: ${mother.firstName} ${mother.surname}` : ''}${spouse ? `, Małżonek: ${spouse.firstName} ${spouse.surname}` : ''}${children.length > 0 ? `, Dzieci: ${children.map((c) => `${c.firstName} ${c.surname}`).join(', ')}` : ''}`;
    }).join('\n');

    return `Członkowie rodziny:\n${memberInfo}\n\nRazem: ${members.length} członków, ${members.filter((m) => m.isAlive).length} żyje, ${members.filter((m) => !m.isAlive).length} zmarłych.\n\nZdjęcia: ${photos.length} zdjęć w galerii.`;
  };

  const buildKnowledgeContext = () => {
    if (!knowledgeDocs || knowledgeDocs.length === 0) return '';

    return '\n\nDODATKOWE INFORMACJE Z DOKUMENTÓW GENEALOGICZNYCH:\n' +
      knowledgeDocs.map(doc => `\n${doc.title}:\n${doc.content.substring(0, 4000)}`).join('\n\n');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploaded = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }

    setUploadedImages(prev => [...prev, ...uploaded]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Błąd nagrywania:', err);
      alert('Nie można uzyskać dostępu do mikrofonu');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedImages.length === 0 && !audioBlob) || isLoading) return;

    const userMessage = input.trim() || (audioBlob ? '[Wiadomość głosowa]' : '[Wiadomość ze zdjęciami]');
    const imageUrls = [...uploadedImages];
    const voice = audioBlob;

    setInput('');
    setUploadedImages([]);
    setAudioBlob(null);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      images: imageUrls,
      hasAudio: !!voice
    }]);
    setIsLoading(true);

    try {
      const familyContext = buildFamilyContext();
      const knowledgeContext = buildKnowledgeContext();

      let finalPrompt = userMessage;
      const allFileUrls = [...imageUrls];

      // Handle voice recording - convert to WAV for better compatibility
      if (voice) {
        try {
          // Convert webm to wav using browser's audio API
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await voice.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create WAV file
          const wav = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wav], { type: 'audio/wav' });
          const audioFile = new File([wavBlob], 'nagranie.wav', { type: 'audio/wav' });

          const { file_url: audioUrl } = await base44.integrations.Core.UploadFile({ file: audioFile });
          allFileUrls.push(audioUrl);
          finalPrompt = userMessage === '[Wiadomość głosowa]' ? 'Przepisz i odpowiedz na to nagranie audio' : userMessage;
        } catch (err) {
          console.error('Audio conversion error:', err);
          // Fallback: just include text message
          finalPrompt = userMessage + ' [Nie udało się przetworzyć audio]';
        }
      }

      const systemPrompt = `Jesteś pomocnym asystentem drzewa genealogicznego. Odpowiadaj na pytania na podstawie dostarczonych danych rodzinnych i dokumentów historycznych. Bądź zwięzły i przyjazny. Odpowiadaj TYLKO po polsku.

Gdy użytkownik pyta o konkretnego członka rodziny, zaproponuj otwarcie profilu.
Gdy pytają o zdjęcia, zaproponuj przefiltrowanie galerii.
Jeśli pytają o relacje, śledź połączenia rodzinne.

${familyContext}${knowledgeContext}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nPytanie użytkownika: ${finalPrompt}`,
        file_urls: allFileUrls.length > 0 ? allFileUrls : undefined,
        add_context_from_internet: false,
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

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        action: response.suggestedAction,
        memberName: response.memberName,
        photoFilter: response.photoFilter
      }]);
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd: ' + (err.message || 'Nieznany błąd')
      }]);
    }

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
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-br text-white rounded-full fixed bottom-6 right-24 z-40 w-14 h-14 from-purple-500 to-indigo-600 shadow-xl flex items-center justify-center">
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
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
                  <h3 className="font-semibold text-gray-800">Asystent AI</h3>
                  <p className="text-xs text-gray-500">Zapytaj o rodzinę</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-emerald-100' : 'bg-gradient-to-br from-purple-100 to-indigo-100'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-emerald-600" /> : <Bot className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                        msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                          {msg.content}
                        </ReactMarkdown>

                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                            ))}
                          </div>
                        )}

                        {msg.hasAudio && (
                          <div className="mt-2 text-xs opacity-70">🎤 Nagranie głosowe</div>
                        )}
                      </div>

                      {msg.action && msg.action !== 'none' && (
                        <button
                          onClick={() => handleAction(msg.action, msg.memberName, msg.photoFilter)}
                          className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                          <ExternalLink className="w-3 h-3" />
                          {msg.action === 'openProfile' ? 'Otwórz profil' : 'Zobacz galerię'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-100">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Image previews */}
            {uploadedImages.length > 0 && (
              <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}



            {/* Audio preview */}
            {audioBlob && (
              <div className="px-4 py-2 border-t">
                <div className="flex items-center gap-2 bg-purple-50 p-2 rounded">
                  <Mic className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Nagranie gotowe</span>
                  <button onClick={() => setAudioBlob(null)} className="ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2 mb-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outline" size="icon" asChild>
                    <span className="cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                  </Button>
                </label>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'bg-red-100' : ''}>
                  {isRecording ? <StopCircle className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Zadaj pytanie o rodzinę..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && uploadedImages.length === 0 && !audioBlob) || isLoading}
                  className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}