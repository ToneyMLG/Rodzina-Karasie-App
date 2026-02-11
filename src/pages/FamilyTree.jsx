import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, TreePine, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { LanguageProvider, useLanguage } from '@/components/family-tree/LanguageContext';
import Sidebar from '@/components/family-tree/Sidebar';
import DraggableTreeCanvas from '@/components/family-tree/DraggableTreeCanvas';
import GalleryView from '@/components/family-tree/GalleryView';
import MemberProfileModal from '@/components/family-tree/MemberProfileModal';
import ShareModal from '@/components/family-tree/ShareModal';
import EnhancedAIChatbot from '@/components/family-tree/EnhancedAIChatbot';

function FamilyTreeContent() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState('tree');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingMember, setIsCreatingMember] = useState(false);

  // Check for share token in URL
  const [shareToken, setShareToken] = useState(null);
  const [shareRole, setShareRole] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      setShareToken(token);
      // Fetch share link to determine role
      db.shareLinks.filter({ token }).then(links => {
        if (links.length > 0 && links[0].isActive) {
          setShareRole(links[0].role);
          // Update access count
          db.shareLinks.update(links[0].id, { accessCount: (links[0].accessCount || 0) + 1 });
        }
      }).catch(() => {
        // If share link doesn't exist or error, still allow access
      });
    }
  }, []);

  const isViewOnly = shareRole === 'viewer';
  const canEdit = !shareToken || shareRole === 'editor';

  // Fetch data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: () => db.familyMembers.list()
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['familyPhotos'],
    queryFn: () => db.familyPhotos.list()
  });

  const { data: shareLinks = [] } = useQuery({
    queryKey: ['shareLinks'],
    queryFn: () => db.shareLinks.list()
  });

  // Mutations
  const createMemberMutation = useMutation({
    mutationFn: (data) => db.familyMembers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      setIsCreatingMember(false);
      toast.success('Member added successfully');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => db.familyMembers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      toast.success('Member updated successfully');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => db.familyMembers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      setSelectedMember(null);
      toast.success('Member removed from tree');
    }
  });

  const createPhotoMutation = useMutation({
    mutationFn: (data) => db.familyPhotos.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
      toast.success('Photo uploaded successfully');
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: ({ id, data }) => db.familyPhotos.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
    }
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => db.familyPhotos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
      toast.success('Photo deleted');
    }
  });

  const createShareLinkMutation = useMutation({
    mutationFn: (role) => db.shareLinks.create({
      token: crypto.randomUUID(),
      role,
      isActive: true,
      accessCount: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks'] });
      toast.success('Share link created');
    }
  });

  const deleteShareLinkMutation = useMutation({
    mutationFn: (id) => db.shareLinks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks'] });
    }
  });

  // Handlers
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsCreatingMember(false);
    setIsProfileModalOpen(true);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setIsCreatingMember(true);
    setIsProfileModalOpen(true);
  };

  const handleSaveMember = (data) => {
    if (isCreatingMember) {
      createMemberMutation.mutate(data);
    } else if (selectedMember) {
      updateMemberMutation.mutate({ id: selectedMember.id, data });
    }
  };

  const handleDeleteMember = () => {
    if (selectedMember) {
      deleteMemberMutation.mutate(selectedMember.id);
    }
  };

  const handleExportPDF = async () => {
    toast.info('Generating PDF...');
    // Simple PDF export using the browser's print functionality
    window.print();
  };

  const handleNavigateToMember = (member) => {
    setActiveView('tree');
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  const handleNavigateToGallery = (filter) => {
    setActiveView('gallery');
  };


  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-white shadow-md"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-20 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          members={members}
          selectedMemberId={selectedMember?.id}
          onMemberSelect={handleMemberClick}
          onAddMember={canEdit ? handleAddMember : undefined}
          onExportPDF={handleExportPDF}
          onShare={!isViewOnly ? () => setIsShareModalOpen(true) : undefined}
          isViewOnly={isViewOnly}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                {t('familyTree')}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                {t('gallery')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {shareToken && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              shareRole === 'viewer'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {shareRole === 'viewer' ? t('viewer') : t('editor')} Mode
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'tree' ? (
              <motion.div
                key="tree"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <DraggableTreeCanvas
                  members={members}
                  onMemberClick={handleMemberClick}
                  onAddMember={canEdit ? handleAddMember : undefined}
                  selectedMemberId={selectedMember?.id}
                  isViewOnly={isViewOnly}
                />
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <GalleryView
                  photos={photos}
                  members={members}
                  onUpload={(data) => createPhotoMutation.mutate(data)}
                  onDelete={(id) => deletePhotoMutation.mutate(id)}
                  onUpdateTags={(id, data) => updatePhotoMutation.mutate({ id, data })}
                  isViewOnly={isViewOnly}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <MemberProfileModal
        member={isCreatingMember ? null : selectedMember}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsCreatingMember(false);
        }}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        allMembers={members}
        isViewOnly={isViewOnly}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareLinks={shareLinks}
        onCreateLink={(role) => createShareLinkMutation.mutate(role)}
        onDeleteLink={(id) => deleteShareLinkMutation.mutate(id)}
      />

      {/* AI Chatbot */}
      <EnhancedAIChatbot
        members={members}
        photos={photos}
        onNavigateToMember={handleNavigateToMember}
        onNavigateToGallery={handleNavigateToGallery}
      />
    </div>
  );
}

export default function FamilyTree() {
  return (
    <LanguageProvider>
      <FamilyTreeContent />
    </LanguageProvider>
  );
}