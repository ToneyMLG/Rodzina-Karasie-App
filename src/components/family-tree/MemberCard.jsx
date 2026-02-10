import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function MemberCard({ member, onClick, isSelected, compact = false }) {
  const { t } = useLanguage();

  const calculateAge = () => {
    if (!member.dateOfBirth) return null;
    const birth = new Date(member.dateOfBirth);
    const end = member.isAlive ? new Date() : member.dateOfDeath ? new Date(member.dateOfDeath) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && end.getDate() < birth.getDate()) {
      age--;
    }
    return age;
  };

  const age = calculateAge();
  const birthYear = member.dateOfBirth ? new Date(member.dateOfBirth).getFullYear() : null;
  const deathYear = member.dateOfDeath ? new Date(member.dateOfDeath).getFullYear() : null;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
          ${isSelected ?
        'bg-emerald-50 border-2 border-emerald-400 shadow-md' :
        'bg-white hover:bg-gray-50 border border-gray-100'}
        `
        }>

        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center overflow-hidden
          ${member.isAlive ? 'bg-emerald-100' : 'bg-gray-100'}
        `}>
          {member.profilePicture ?
          <img src={member.profilePicture} alt="" className="w-full h-full object-cover" /> :

          <User className={`w-5 h-5 ${member.isAlive ? 'text-emerald-600' : 'text-gray-400'}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {member.firstName} {member.surname}
          </p>
          <p className="text-xs text-gray-500">
            {birthYear &&
            <>
                {birthYear}
                {deathYear && ` - ${deathYear}`}
                {!deathYear && member.isAlive && age !== null && ` • ${age} ${t('years')}`}
              </>
            }
          </p>
        </div>
        <div className={`w-2 h-2 rounded-full ${member.isAlive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
      </motion.div>);

  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-44 p-4 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg
        ${member.isAlive ?
      'bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100' :
      'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-gray-400'}
        ${
      isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}
      `}>

      <div className="flex flex-col items-center text-center">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center overflow-hidden mb-3
          ${member.isAlive ?
        'bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-emerald-300' :
        'bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-300'}
        `
        }>
          {member.profilePicture ?
          <img src={member.profilePicture} alt="" className="w-full h-full object-cover" /> :

          <User className={`w-8 h-8 ${member.isAlive ? 'text-emerald-600' : 'text-gray-400'}`} />
          }
        </div>

        <h3 className="text-gray-900 text-lg font-semibold text-center leading-tight">
          {member.firstName}
        </h3>
        <p className="text-slate-700 mb-2 text-base font-medium text-center normal-case">
          {member.surname}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>
            {birthYear}
            {deathYear && ` - ${deathYear}`}
          </span>
        </div>

        {age !== null &&
        <div className={`
            mt-2 px-2 py-0.5 rounded-full text-xs font-medium
            ${member.isAlive ?
        'bg-emerald-100 text-emerald-700' :
        'bg-gray-100 text-gray-600'}
          `
        }>
            {age} {t('years')}
          </div>
        }
      </div>
    </motion.div>);

}