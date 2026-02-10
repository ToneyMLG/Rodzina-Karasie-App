import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, FileDown, Globe, Settings, Users,
  ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MemberCard from './MemberCard';
import { useLanguage } from './LanguageContext';

export default function Sidebar({
  members,
  selectedMemberId,
  onMemberSelect,
  onAddMember,
  onExportPDF,
  onShare,
  isCollapsed,
  onToggleCollapse,
  isViewOnly = false
}) {
  const { t, language, toggleLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m =>
      m.firstName.toLowerCase().includes(query) ||
      m.surname.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const nameA = `${a.surname} ${a.firstName}`.toLowerCase();
      const nameB = `${b.surname} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredMembers]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 0 : 320 }}
      className="h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden shadow-xl relative z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-amber-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">{t('familyTree')}</h1>
              <p className="text-xs text-gray-500">{members.length} members</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="pl-9 bg-white/80 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {sortedMembers.map(member => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MemberCard
                member={member}
                compact
                isSelected={selectedMemberId === member.id}
                onClick={() => onMemberSelect(member)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedMembers.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-400">
            <p>No members found</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
        {!isViewOnly && onAddMember && (
          <Button
            onClick={onAddMember}
            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addMember')}
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onExportPDF}
            className="flex-1"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {t('exportPDF')}
          </Button>
          {!isViewOnly && onShare && (
            <Button
              variant="outline"
              onClick={onShare}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('share')}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={toggleLanguage}
          className="w-full text-gray-600"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === 'en' ? 'Polski' : 'English'}
        </Button>
      </div>
    </motion.aside>
  );
}