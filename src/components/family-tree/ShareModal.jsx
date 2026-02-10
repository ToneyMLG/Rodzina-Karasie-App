import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Link2, Copy, Check, Eye, Edit3,
  Users, Clock, Trash2, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useLanguage } from './LanguageContext';

export default function ShareModal({
  isOpen,
  onClose,
  shareLinks = [],
  onCreateLink,
  onDeleteLink
}) {
  const { t } = useLanguage();
  const [role, setRole] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLink = async () => {
    setIsCreating(true);
    await onCreateLink(role);
    setIsCreating(false);
  };

  const copyToClipboard = (token) => {
    const url = `${window.location.origin}${window.location.pathname}?share=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareUrl = (token) => {
    return `${window.location.origin}${window.location.pathname}?share=${token}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{t('shareTree')}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Role Selection */}
              <div>
                <Label className="text-gray-700 mb-3 block">Select access level</Label>
                <RadioGroup value={role} onValueChange={setRole} className="space-y-3">
                  <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                    role === 'viewer' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="viewer" id="viewer" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="viewer" className="flex items-center gap-2 cursor-pointer font-medium">
                        <Eye className="w-4 h-4 text-blue-600" />
                        {t('viewer')}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">{t('viewerDesc')}</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                    role === 'editor' ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="editor" id="editor" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="editor" className="flex items-center gap-2 cursor-pointer font-medium">
                        <Edit3 className="w-4 h-4 text-purple-600" />
                        {t('editor')}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">{t('editorDesc')}</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Create Link Button */}
              <Button
                onClick={handleCreateLink}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Create Share Link
              </Button>

              {/* Existing Links */}
              {shareLinks.length > 0 && (
                <div>
                  <Label className="text-gray-700 mb-3 block">Active share links</Label>
                  <div className="space-y-2">
                    {shareLinks.filter(l => l.isActive).map(link => (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          link.role === 'viewer' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {link.role === 'viewer'
                            ? <Eye className="w-4 h-4 text-blue-600" />
                            : <Edit3 className="w-4 h-4 text-purple-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 capitalize">{link.role}</p>
                          <p className="text-xs text-gray-400 truncate">{getShareUrl(link.token)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(link.token)}
                            className="h-8 w-8"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteLink(link.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}