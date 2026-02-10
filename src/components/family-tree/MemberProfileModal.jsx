import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Calendar, MapPin, Camera, Trash2, Upload,
  Save, AlertTriangle, Image as ImageIcon, Plus, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useLanguage } from './LanguageContext';

export default function MemberProfileModal({
  member,
  isOpen,
  onClose,
  onSave,
  onDelete,
  allMembers = [],
  isViewOnly = false
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    dateOfBirth: '',
    dateOfDeath: '',
    isAlive: true,
    birthPlace: '',
    tombstoneLocation: '',
    tombstonePhoto: '',
    profilePicture: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
    notes: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        surname: member.surname || '',
        dateOfBirth: member.dateOfBirth || '',
        dateOfDeath: member.dateOfDeath || '',
        isAlive: member.isAlive !== false,
        birthPlace: member.birthPlace || '',
        tombstoneLocation: member.tombstoneLocation || '',
        tombstonePhoto: member.tombstonePhoto || '',
        profilePicture: member.profilePicture || '',
        fatherId: member.fatherId || '',
        motherId: member.motherId || '',
        spouseId: member.spouseId || '',
        notes: member.notes || ''
      });
    } else {
      setFormData({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        dateOfDeath: '',
        isAlive: true,
        birthPlace: '',
        tombstoneLocation: '',
        tombstonePhoto: '',
        profilePicture: '',
        fatherId: '',
        motherId: '',
        spouseId: '',
        notes: ''
      });
    }
    setErrors({});
  }, [member, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, [field]: file_url }));
    setIsUploading(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = t('required');
    if (!formData.surname.trim()) newErrors.surname = t('required');
    if (!formData.dateOfBirth) newErrors.dateOfBirth = t('required');

    if (formData.dateOfDeath && formData.dateOfBirth) {
      if (new Date(formData.dateOfDeath) < new Date(formData.dateOfBirth)) {
        newErrors.dateOfDeath = 'Death date cannot be before birth date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(formData);
  };

  const handleExportPDF = () => {
    if (!member) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(`${member.firstName} ${member.surname}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Divider
    doc.setDrawColor(100, 100, 100);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    // Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');

    const addField = (label, value) => {
      if (value) {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPos);
        yPos += 10;
      }
    };

    // Calculate age
    let age = '';
    if (member.dateOfBirth) {
      const birth = new Date(member.dateOfBirth);
      const end = member.isAlive ? new Date() : (member.dateOfDeath ? new Date(member.dateOfDeath) : new Date());
      let ageYears = end.getFullYear() - birth.getFullYear();
      const monthDiff = end.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        ageYears--;
      }
      age = `${ageYears} ${t('years')}`;
    }

    const father = member.fatherId ? allMembers.find(m => m.id === member.fatherId) : null;
    const mother = member.motherId ? allMembers.find(m => m.id === member.motherId) : null;
    const spouse = member.spouseId ? allMembers.find(m => m.id === member.spouseId) : null;

    addField(t('firstName'), member.firstName);
    addField(t('surname'), member.surname);
    addField(t('dateOfBirth'), member.dateOfBirth);
    if (age) addField(t('age'), age);
    addField(t('stillAlive'), member.isAlive ? t('alive') : t('deceased'));
    if (!member.isAlive && member.dateOfDeath) {
      addField(t('dateOfDeath'), member.dateOfDeath);
    }
    addField(t('birthPlace'), member.birthPlace);
    if (father) addField('Father', `${father.firstName} ${father.surname}`);
    if (mother) addField('Mother', `${mother.firstName} ${mother.surname}`);
    if (spouse) addField(t('spouse'), `${spouse.firstName} ${spouse.surname}`);
    if (!member.isAlive) {
      addField(t('tombstoneLocation'), member.tombstoneLocation);
    }
    if (member.notes) {
      yPos += 5;
      doc.setFont(undefined, 'bold');
      doc.text(`${t('notes')}:`, 20, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(member.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPos);
    }

    // Save PDF
    doc.save(`${member.firstName}_${member.surname}_${language}.pdf`);
  };

  const otherMembers = allMembers.filter(m => !member || m.id !== member.id);

  return (
    <>
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-amber-50">
                <h2 className="text-xl font-semibold text-gray-800">
                  {member ? `${member.firstName} ${member.surname}` : t('addMember')}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture */}
                  <div className="md:col-span-2 flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                        {formData.profilePicture ? (
                          <img src={formData.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-emerald-600" />
                        )}
                      </div>
                      {!isViewOnly && (
                        <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-md">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'profilePicture')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">{t('profilePicture')}</h3>
                      <p className="text-xs text-gray-400">{isViewOnly ? '' : 'Click the camera to upload'}</p>
                    </div>
                  </div>

                  {/* First Name */}
                  <div>
                    <Label className="text-gray-700">{t('firstName')} *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      disabled={isViewOnly}
                      className={errors.firstName ? 'border-red-300' : ''}
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  {/* Surname */}
                  <div>
                    <Label className="text-gray-700">{t('surname')} *</Label>
                    <Input
                      value={formData.surname}
                      onChange={(e) => handleChange('surname', e.target.value)}
                      disabled={isViewOnly}
                      className={errors.surname ? 'border-red-300' : ''}
                    />
                    {errors.surname && <p className="text-xs text-red-500 mt-1">{errors.surname}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <Label className="text-gray-700">{t('dateOfBirth')} *</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      disabled={isViewOnly}
                      className={errors.dateOfBirth ? 'border-red-300' : ''}
                    />
                    {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                  </div>

                  {/* Still Alive */}
                  <div className="flex items-center gap-3 pt-6">
                    <Checkbox
                      id="isAlive"
                      checked={formData.isAlive}
                      onCheckedChange={(checked) => handleChange('isAlive', checked)}
                      disabled={isViewOnly}
                    />
                    <Label htmlFor="isAlive" className="text-gray-700 cursor-pointer">{t('stillAlive')}</Label>
                  </div>

                  {/* Date of Death */}
                  {!formData.isAlive && (
                    <div>
                      <Label className="text-gray-700">{t('dateOfDeath')}</Label>
                      <Input
                        type="date"
                        value={formData.dateOfDeath}
                        onChange={(e) => handleChange('dateOfDeath', e.target.value)}
                        disabled={isViewOnly}
                        className={errors.dateOfDeath ? 'border-red-300' : ''}
                      />
                      {errors.dateOfDeath && <p className="text-xs text-red-500 mt-1">{errors.dateOfDeath}</p>}
                    </div>
                  )}

                  {/* Birth Place */}
                  <div>
                    <Label className="text-gray-700">{t('birthPlace')}</Label>
                    <Input
                      value={formData.birthPlace}
                      onChange={(e) => handleChange('birthPlace', e.target.value)}
                      disabled={isViewOnly}
                      placeholder={t('optional')}
                    />
                  </div>

                  {/* Spouse */}
                  <div>
                    <Label className="text-gray-700">{t('selectSpouse')}</Label>
                    <Select
                      value={formData.spouseId || 'none'}
                      onValueChange={(v) => handleChange('spouseId', v === 'none' ? '' : v)}
                      disabled={isViewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('none')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('none')}</SelectItem>
                        {otherMembers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.surname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Father */}
                  <div>
                    <Label className="text-gray-700">Father</Label>
                    <Select
                      value={formData.fatherId || 'none'}
                      onValueChange={(v) => handleChange('fatherId', v === 'none' ? '' : v)}
                      disabled={isViewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('none')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('none')}</SelectItem>
                        {otherMembers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.surname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mother */}
                  <div>
                    <Label className="text-gray-700">Mother</Label>
                    <Select
                      value={formData.motherId || 'none'}
                      onValueChange={(v) => handleChange('motherId', v === 'none' ? '' : v)}
                      disabled={isViewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('none')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('none')}</SelectItem>
                        {otherMembers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.surname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tombstone Location (if deceased) */}
                  {!formData.isAlive && (
                    <>
                      <div>
                        <Label className="text-gray-700">{t('tombstoneLocation')}</Label>
                        <Input
                          value={formData.tombstoneLocation}
                          onChange={(e) => handleChange('tombstoneLocation', e.target.value)}
                          disabled={isViewOnly}
                          placeholder={t('optional')}
                        />
                      </div>

                      <div>
                        <Label className="text-gray-700">{t('tombstonePhoto')}</Label>
                        <div className="flex items-center gap-2">
                          {formData.tombstonePhoto ? (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <img src={formData.tombstonePhoto} alt="" className="w-full h-full object-cover" />
                              {!isViewOnly && (
                                <button
                                  onClick={() => handleChange('tombstonePhoto', '')}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : !isViewOnly && (
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                              <Upload className="w-6 h-6 text-gray-400" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'tombstonePhoto')}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <Label className="text-gray-700">{t('notes')}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      disabled={isViewOnly}
                      placeholder={t('optional')}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex gap-2">
                  {!isViewOnly && member && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('removeFromTree')}
                    </Button>
                  )}
                  {member && (
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      {t('exportPDF')}
                    </Button>
                  )}
                </div>
                {!isViewOnly && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isUploading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('saveChanges')}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {t('removeFromTree')}
            </DialogTitle>
            <DialogDescription>
              {t('confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete();
              }}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}