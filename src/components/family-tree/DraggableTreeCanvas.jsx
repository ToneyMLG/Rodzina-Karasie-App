import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Plus, Pencil, Save, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemberCard from './MemberCard';
import { useLanguage } from './LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function DraggableTreeCanvas({ members, onMemberClick, onAddMember, selectedMemberId, isViewOnly = false }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const queryClient = useQueryClient();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [positions, setPositions] = useState({});
  const [draggingMember, setDraggingMember] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [customLines, setCustomLines] = useState([]);
  const [selectedForLine, setSelectedForLine] = useState(null);

  // Touch handling for mobile
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastTouchCenter, setLastTouchCenter] = useState(null);

  // Load saved layout
  const { data: layoutData } = useQuery({
    queryKey: ['treeLayout'],
    queryFn: async () => {
      const layouts = await base44.entities.TreeLayout.list();
      return layouts[0] || null;
    }
  });

  useEffect(() => {
    // Load positions from member records
    const memberPositions = {};
    members.forEach(m => {
      if (m.positionX !== undefined && m.positionY !== undefined) {
        memberPositions[m.id] = { x: m.positionX, y: m.positionY };
      }
    });
    setPositions(memberPositions);
  }, [members]);

  useEffect(() => {
    if (layoutData) {
      if (layoutData.customLines) setCustomLines(layoutData.customLines);
    }
  }, [layoutData]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (data) => {
      if (layoutData?.id) {
        return base44.entities.TreeLayout.update(layoutData.id, data);
      } else {
        return base44.entities.TreeLayout.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['treeLayout']);
    }
  });

  const handleSaveLayout = async () => {
    // Save positions to individual member records
    for (const memberId in positions) {
      const pos = positions[memberId];
      await base44.entities.FamilyMember.update(memberId, {
        positionX: pos.x,
        positionY: pos.y
      });
    }

    // Save custom lines to TreeLayout
    saveLayoutMutation.mutate({ customLines });
    setHasUnsavedChanges(false);
  };

  // Panning
  const handleMouseDown = (e) => {
    if (draggingMember || isDrawingMode) return;
    if (e.button === 0) {
      const target = e.target;
      const isCanvas = target.classList.contains('canvas-background') ||
                      target.tagName === 'svg' ||
                      target === canvasRef.current;

      if (isCanvas) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingMember) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - pan.x / zoom - dragStart.offsetX - 400;
      const y = (e.clientY - rect.top) / zoom - pan.y / zoom - dragStart.offsetY - 200;

      setPositions(prev => ({
        ...prev,
        [draggingMember]: { x, y }
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingMember(null);
  };

  const handleCardClick = (e, memberId) => {
    if (isViewOnly) return;

    if (isDrawingMode) {
      e.stopPropagation();

      if (!selectedForLine) {
        // First click - select this member
        setSelectedForLine(memberId);
      } else if (selectedForLine === memberId) {
        // Clicked same member - deselect
        setSelectedForLine(null);
      } else {
        // Second click - create line
        setCustomLines(prev => [...prev, {
          fromId: selectedForLine,
          toId: memberId,
          color: '#6366f1',
          label: ''
        }]);
        setSelectedForLine(null);
        setHasUnsavedChanges(true);
      }
      return;
    }

    // Open profile
    onMemberClick(members.find(m => m.id === memberId));
  };

  const handleCardMouseDown = (e, memberId) => {
    if (isViewOnly || isDrawingMode) return;

    e.stopPropagation();

    setDraggingMember(memberId);
    setDragStart({
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    });
  };

  const getPosition = (memberId) => {
    if (positions[memberId]) return positions[memberId];

    // Default grid layout
    const index = members.findIndex(m => m.id === memberId);
    const cols = Math.ceil(Math.sqrt(members.length));
    return {
      x: (index % cols) * 220,
      y: Math.floor(index / cols) * 220
    };
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Touch handlers for mobile
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single finger pan
      const target = e.target;
      const isCanvas = target.classList.contains('canvas-background') ||
                      target.tagName === 'svg' ||
                      target === canvasRef.current;

      if (isCanvas) {
        setIsPanning(true);
        setStartPan({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      const zoomDelta = (distance - lastTouchDistance) * 0.01;
      setZoom(prev => Math.min(Math.max(0.3, prev + zoomDelta), 2));
      setLastTouchDistance(distance);
      e.preventDefault();
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      setPan({ x: e.touches[0].clientX - startPan.x, y: e.touches[0].clientY - startPan.y });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 no-print">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
          title="Powiększ">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
          title="Pomniejsz">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
          title="Reset widoku">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm font-medium text-gray-600">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Drawing and Save Tools */}
      {!isViewOnly && (
        <div className="absolute top-4 left-4 z-20 flex gap-2 no-print">
          <Button
            variant={isDrawingMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={isDrawingMode ? "bg-indigo-600" : "bg-white/90"}>
            <Pencil className="w-4 h-4 mr-2" />
            {isDrawingMode ? 'Rysowanie ON' : 'Rysuj linie'}
          </Button>
          <Button
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm"
            onClick={handleSaveLayout}
            className={hasUnsavedChanges ? "bg-emerald-600" : "bg-white/90"}>
            <Save className="w-4 h-4 mr-2" />
            {hasUnsavedChanges ? 'Zapisz zmiany' : 'Układ zapisany'}
          </Button>
        </div>
      )}

      {/* Add member button */}
      {!isViewOnly && onAddMember && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddMember}
          className="bg-gradient-to-br text-white rounded-full absolute bottom-6 right-6 z-20 w-14 h-14 from-emerald-500 to-emerald-600 shadow-xl flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`w-full h-full overflow-hidden canvas-background ${
          isPanning ? 'cursor-grabbing' : isDrawingMode ? 'cursor-crosshair' : 'cursor-grab'
        }`}
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

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            left: 400,
            top: 200
          }}>

          {/* SVG for custom lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '5000px', height: '5000px' }}>
            {customLines.map((line, idx) => {
              const fromPos = getPosition(line.fromId);
              const toPos = getPosition(line.toId);
              return (
                <line
                  key={idx}
                  x1={fromPos.x + 88}
                  y1={fromPos.y + 90}
                  x2={toPos.x + 88}
                  y2={toPos.y + 90}
                  stroke={line.color || '#6366f1'}
                  strokeWidth="3"
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {/* Member cards */}
          {members.map(member => {
            const pos = getPosition(member.id);
            const isSelectedForDrawing = selectedForLine === member.id;
            return (
              <div
                key={member.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  cursor: isViewOnly ? 'pointer' : (isDrawingMode ? 'crosshair' : 'move'),
                  zIndex: draggingMember === member.id ? 100 : 1,
                  outline: isSelectedForDrawing ? '3px solid #6366f1' : 'none',
                  borderRadius: isSelectedForDrawing ? '12px' : '0'
                }}
                onMouseDown={(e) => handleCardMouseDown(e, member.id)}
                onClick={(e) => handleCardClick(e, member.id)}>
                <MemberCard
                  member={member}
                  onClick={() => {}}
                  isSelected={selectedMemberId === member.id}
                />
              </div>
            );
          })}
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