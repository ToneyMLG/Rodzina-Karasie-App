import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Tag, Image as ImageIcon, Search,
  Filter, Trash2, Check, Plus, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useLanguage } from './LanguageContext';

export default function GalleryView({
  photos,
  members,
  onUpload,
  onDelete,
  onUpdateTags,
  isViewOnly = false
}) {
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [selectedCustomTags, setSelectedCustomTags] = useState([]);

  // Get all unique custom tags
  const allCustomTags = [...new Set(photos.flatMap(p => p.customTags || []))];

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    if (filterMember && !(photo.taggedMemberIds || []).includes(filterMember)) {
      return false;
    }
    if (filterTag && !(photo.customTags || []).includes(filterTag)) {
      return false;
    }
    return true;
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onUpload({
        url: file_url,
        title: file.name,
        taggedMemberIds: [],
        customTags: [],
        uploadDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsUploading(false);
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onUpload({
        url: file_url,
        title: file.name,
        taggedMemberIds: [],
        customTags: [],
        uploadDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsUploading(false);
  }, [onUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const openPhotoDetail = (photo) => {
    setSelectedPhoto(photo);
    setSelectedMemberIds(photo.taggedMemberIds || []);
    setSelectedCustomTags(photo.customTags || []);
    setEditingTags(false);
  };

  const handleSaveTags = async () => {
    if (!selectedPhoto) return;
    await onUpdateTags(selectedPhoto.id, {
      taggedMemberIds: selectedMemberIds,
      customTags: selectedCustomTags
    });
    setEditingTags(false);
    setSelectedPhoto({
      ...selectedPhoto,
      taggedMemberIds: selectedMemberIds,
      customTags: selectedCustomTags
    });
  };

  const addCustomTag = () => {
    if (customTagInput.trim() && !selectedCustomTags.includes(customTagInput.trim())) {
      setSelectedCustomTags([...selectedCustomTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const toggleMemberTag = (memberId) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('gallery')}</h2>
          <p className="text-gray-500">{photos.length} photos</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="">{t('tagMembers')}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.surname}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="">{t('customTags')}</option>
                {allCustomTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {(filterMember || filterTag) && (
            <Button
              variant="outline"
              onClick={() => { setFilterMember(''); setFilterTag(''); }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Upload area */}
        {!isViewOnly && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mb-6 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white/50 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="gallery-upload"
            />
            <label htmlFor="gallery-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">{t('dragDrop')}</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP</p>
            </label>
            {isUploading && (
              <div className="mt-4">
                <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredPhotos.map(photo => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => openPhotoDetail(photo)}
                  className="aspect-square rounded-xl overflow-hidden shadow-lg cursor-pointer relative group"
                >
                  <img
                    src={photo.url}
                    alt={photo.title || ''}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex flex-wrap gap-1">
                        {(photo.taggedMemberIds || []).slice(0, 2).map(id => {
                          const member = members.find(m => m.id === id);
                          return member ? (
                            <Badge key={id} variant="secondary" className="text-xs bg-white/90">
                              {member.firstName}
                            </Badge>
                          ) : null;
                        })}
                        {(photo.taggedMemberIds || []).length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-white/90">
                            +{(photo.taggedMemberIds || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{t('noPhotos')}</p>
          </div>
        )}
      </div>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.title || 'Photo'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={selectedPhoto?.url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">{t('tagMembers')}</h3>
                    {!isViewOnly && !editingTags && (
                      <Button variant="outline" size="sm" onClick={() => setEditingTags(true)}>
                        {t('edit')}
                      </Button>
                    )}
                  </div>

                  {editingTags ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {members.map(member => (
                        <button
                          key={member.id}
                          onClick={() => toggleMemberTag(member.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                            selectedMemberIds.includes(member.id)
                              ? 'bg-emerald-100 border-emerald-400'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {selectedMemberIds.includes(member.id) && (
                            <Check className="w-4 h-4 text-emerald-600" />
                          )}
                          <span>{member.firstName} {member.surname}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(selectedPhoto?.taggedMemberIds || []).map(id => {
                        const member = members.find(m => m.id === id);
                        return member ? (
                          <Badge key={id} variant="secondary" className="bg-emerald-100 text-emerald-700">
                            <Users className="w-3 h-3 mr-1" />
                            {member.firstName} {member.surname}
                          </Badge>
                        ) : null;
                      })}
                      {(!selectedPhoto?.taggedMemberIds || selectedPhoto.taggedMemberIds.length === 0) && (
                        <p className="text-gray-400 text-sm">No members tagged</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">{t('customTags')}</h3>

                  {editingTags && (
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Add tag..."
                        onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                      />
                      <Button variant="outline" size="icon" onClick={addCustomTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(editingTags ? selectedCustomTags : (selectedPhoto?.customTags || [])).map(tag => (
                      <Badge key={tag} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        {editingTags && (
                          <button
                            onClick={() => setSelectedCustomTags(prev => prev.filter(t => t !== tag))}
                            className="ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {!editingTags && (!selectedPhoto?.customTags || selectedPhoto.customTags.length === 0) && (
                      <p className="text-gray-400 text-sm">No custom tags</p>
                    )}
                  </div>
                </div>

                {editingTags && (
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingTags(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleSaveTags} className="bg-emerald-600 hover:bg-emerald-700">
                      {t('saveChanges')}
                    </Button>
                  </div>
                )}

                {!isViewOnly && !editingTags && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedPhoto) {
                        onDelete(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}