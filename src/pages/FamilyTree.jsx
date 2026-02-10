import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

const FamilyMember = base44.entities.FamilyMember;
const FamilyPhoto = base44.entities.FamilyPhoto;
const ShareLink = base44.entities.ShareLink;

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
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    base44.auth.me().then(user => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    }).catch(() => {
      setCurrentUser(null);
      setIsCheckingAuth(false);
    });

    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      setShareToken(token);
      // Fetch share link to determine role
      ShareLink.filter({ token }).then(links => {
        if (links.length > 0 && links[0].isActive) {
          setShareRole(links[0].role);
          // Update access count
          ShareLink.update(links[0].id, { accessCount: (links[0].accessCount || 0) + 1 });
        }
      });
    }
  }, []);

  const isViewOnly = shareRole === 'viewer';
  const canEdit = !shareToken || shareRole === 'editor';

  // User has access if:
  // 1. They are the authenticated owner/admin
  // 2. They have a valid share token from the app
  const hasAccess = currentUser || (!!shareToken && shareRole);

  // Fetch data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: () => FamilyMember.list()
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['familyPhotos'],
    queryFn: () => FamilyPhoto.list()
  });

  const { data: shareLinks = [] } = useQuery({
    queryKey: ['shareLinks'],
    queryFn: () => ShareLink.list()
  });

  // Mutations
  const createMemberMutation = useMutation({
    mutationFn: (data) => FamilyMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      setIsCreatingMember(false);
      toast.success('Member added successfully');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => FamilyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      toast.success('Member updated successfully');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => FamilyMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      setIsProfileModalOpen(false);
      setSelectedMember(null);
      toast.success('Member removed from tree');
    }
  });

  const createPhotoMutation = useMutation({
    mutationFn: (data) => FamilyPhoto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
      toast.success('Photo uploaded successfully');
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: ({ id, data }) => FamilyPhoto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
    }
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => FamilyPhoto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyPhotos'] });
      toast.success('Photo deleted');
    }
  });

  const createShareLinkMutation = useMutation({
    mutationFn: (role) => ShareLink.create({
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
    mutationFn: (id) => ShareLink.delete(id),
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show 404 if accessed without a valid share link or authentication
  if (!hasAccess) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This family tree is private. You need a valid share link to access it.
          </p>
          <p className="text-sm text-gray-500">
            If you believe you should have access, please contact the owner for a share link.
          </p>
        </div>
      </div>
    );
  }

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