import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemberCard from './MemberCard';
import { useLanguage } from './LanguageContext';

export default function TreeCanvas({ members, onMemberClick, onAddMember, selectedMemberId, isViewOnly = false, onUpdatePosition }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggingMember, setDraggingMember] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Removed generation calculations - not needed for simple vertical list

  // Build hierarchical family tree: generations with proper parent relationships
  const familyTree = React.useMemo(() => {
    // Calculate generation for each member
    const generations = {};
    const visited = new Set();

    const getGeneration = (memberId, depth = 0) => {
      if (depth > 20 || !memberId) return 0;
      if (visited.has(memberId)) return generations[memberId] || 0;

      visited.add(memberId);
      const member = members.find(m => m.id === memberId);
      if (!member) return 0;

      // If has parents, generation is parent's generation + 1
      const father = member.fatherId ? members.find(m => m.id === member.fatherId) : null;
      const mother = member.motherId ? members.find(m => m.id === member.motherId) : null;

      if (father || mother) {
        const fatherGen = father ? getGeneration(father.id, depth + 1) : 0;
        const motherGen = mother ? getGeneration(mother.id, depth + 1) : 0;
        generations[memberId] = Math.max(fatherGen, motherGen) + 1;
      } else {
        generations[memberId] = 0;
      }

      return generations[memberId];
    };

    members.forEach(m => getGeneration(m.id));

    // Group by generation
    const byGeneration = {};
    members.forEach(member => {
      const gen = generations[member.id] || 0;
      if (!byGeneration[gen]) byGeneration[gen] = [];
      byGeneration[gen].push(member);
    });

    // Sort generations
    const sortedGens = Object.keys(byGeneration).map(Number).sort((a, b) => a - b);

    // For each generation, group couples together
    return sortedGens.map(gen => {
      const membersInGen = byGeneration[gen];
      const processedInGen = new Set();
      const units = [];

      membersInGen.forEach(member => {
        if (processedInGen.has(member.id)) return;

        const spouse = member.spouseId ? membersInGen.find(m => m.id === member.spouseId) : null;
        const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

        // Show both parents of this person/couple if they exist
        const father = member.fatherId ? members.find(m => m.id === member.fatherId) : null;
        const mother = member.motherId ? members.find(m => m.id === member.motherId) : null;

        units.push({
          members: spouse ? [member, spouse] : [member],
          children: children,
          parents: [father, mother].filter(p => p)
        });

        processedInGen.add(member.id);
        if (spouse) processedInGen.add(spouse.id);
      });

      return { generation: gen, units };
    });
  }, [members]);

  // Simple vertical list layout - no complex positioning needed
  // Removed: using CSS flexbox instead

  // Removed: no connection lines needed for vertical list layout

  // Panning: left mouse button drag (desktop) or touch drag (mobile)
  const handleMouseDown = (e) => {
    // Pan on any mouse down (left button)
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setStartPan({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - startPan.x, y: e.touches[0].clientY - startPan.y });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 no-print">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
          title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
          title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
          title="Reset View">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm font-medium text-gray-600">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Add member button */}
      {!isViewOnly && onAddMember && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddMember}
          className="bg-gradient-to-br text-white rounded-full absolute bottom-6 right-6 z-20 w-14 h-14 from-emerald-500 to-emerald-600 shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow">
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Scrollable canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY * -0.0015;
          setZoom(prev => Math.min(Math.max(0.3, prev + delta), 2));
        }}>

        {/* Family list container */}
        <div
          className="min-h-full flex items-center justify-center p-8"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}>

          <div className="flex flex-col gap-12 max-w-6xl w-full">
            {familyTree.map((genGroup, genIdx) => (
              <div key={genIdx} className="space-y-6">
                {/* Generation units (couples/singles at same level) */}
                <div className="flex flex-wrap gap-8 justify-center">
                  {genGroup.units.map((unit, unitIdx) => (
                    <div key={unitIdx} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                      {/* Show parents of this unit if any */}
                      {unit.parents.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-emerald-600 mb-2 text-center">Parents</div>
                          <div className="flex gap-3 justify-center">
                            {unit.parents.map(parent => (
                              <div key={parent.id} className="flex-shrink-0 opacity-60 scale-75">
                                <MemberCard
                                  member={parent}
                                  onClick={() => onMemberClick(parent)}
                                  isSelected={selectedMemberId === parent.id}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                          <div className="h-4 border-l-2 border-emerald-300 mx-auto w-0 mt-2"></div>
                        </div>
                      )}

                      {/* Current generation members (couple or single) */}
                      <div className="flex gap-4 justify-center mb-4">
                        {unit.members.map(member => (
                          <div key={member.id} className="flex-shrink-0">
                            <MemberCard
                              member={member}
                              onClick={() => onMemberClick(member)}
                              isSelected={selectedMemberId === member.id}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Children */}
                      {unit.children.length > 0 && (
                        <div>
                          <div className="h-4 border-l-2 border-emerald-300 mx-auto w-0 mb-2"></div>
                          <div className="text-sm font-medium text-emerald-700 mb-3 text-center">
                            {t('children')} ({unit.children.length})
                          </div>
                          <div className="flex flex-wrap gap-4 justify-center">
                            {unit.children.map(child => (
                              <div key={child.id} className="flex-shrink-0">
                                <MemberCard
                                  member={child}
                                  onClick={() => onMemberClick(child)}
                                  isSelected={selectedMemberId === child.id}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl max-w-md">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
              <Plus className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noMembers')}</h3>
            <Button onClick={onAddMember} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              {t('addMember')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}