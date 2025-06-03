import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Trophy } from 'lucide-react';
import OptimizedContestantImage from './OptimizedContestantImage';

const ContestantModal = ({ contestant, isOpen, onClose }) => {
  const modalRef = useRef(null);

  // Handle escape key and click outside to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !contestant) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="contestant-modal relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          >
            <X size={20} className="text-gray-500" />
          </button>
          
          {/* Contestant Image */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gray-200 mb-3 sm:mb-4">
              {contestant.image ? (
                <OptimizedContestantImage
                  src={contestant.image}
                  alt={contestant.name}
                  priority={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-gray-500">
                    {contestant.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
              )}
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center px-2">
              {contestant.name}
            </h2>
            {contestant.nickname && (
              <p className="text-gray-600 mt-1 text-center">"{contestant.nickname}"</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="modal-content px-4 sm:px-6 pb-4 sm:pb-6 max-h-80 sm:max-h-96 overflow-y-auto">
          {/* Overall Achievements */}
          {contestant.overallAchievements && contestant.overallAchievements.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center text-sm sm:text-base">
                <Trophy size={16} className="mr-2 flex-shrink-0" />
                Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {contestant.overallAchievements.map((achievement, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium"
                  >
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Season Appearances */}
          {contestant.seasons && contestant.seasons.length > 0 ? (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center text-sm sm:text-base">
                <Calendar size={16} className="mr-2 flex-shrink-0" />
                Season Appearances ({contestant.seasons.length})
              </h3>
              <div className="space-y-2">
                {contestant.seasons.map((seasonInfo, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="font-medium text-gray-800 text-sm sm:text-base">
                      Season {seasonInfo.seasonNumber}: {seasonInfo.seasonName}
                    </div>
                    {seasonInfo.tribe && (
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        {seasonInfo.tribe} Tribe
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm sm:text-base">No detailed season information available for this contestant.</p>
            </div>
          )}
        </div>
        
        {/* Mobile-friendly bottom padding for safe area */}
        <div className="h-safe-bottom sm:hidden" />
      </div>
    </div>,
    document.body
  );
};

export default ContestantModal;