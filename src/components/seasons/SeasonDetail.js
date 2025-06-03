import React, { useRef, useState } from 'react';
import { Users, User } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { getTribesBySeason } from '../../data/tribeData';
import { getContestantByName, contestantData } from '../../data/contestantData';
import ColorCodedScoreBreakdown from '../ui/ColorCodedScoreBreakdown';
import ContestantModal from '../ui/ContestantModal';

const SeasonDetail = ({ season }) => {
  const detailRef = useRef(null);
  const isVisible = useIntersectionObserver(detailRef, { threshold: 0.1 });
  
  // Get tribes data for this season from our data file
  const tribes = getTribesBySeason(season.number);
  
  // Modal state for contestant details
  const [selectedContestant, setSelectedContestant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle contestant click - now works for any contestant
  const handleContestantClick = (memberName) => {
    const contestant = getContestantByName(memberName, season.number); // Pass season number for image path
    setSelectedContestant(contestant);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContestant(null);
  };

  return (
    <div 
      ref={detailRef}
      className={`rounded-xl overflow-hidden shadow-xl bg-white mb-8 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="p-4 md:p-6">
        <div>
          <div className="p-4 md:p-5 rounded-xl bg-gray-50 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-700">Season Overview</h3>
            {season.description ? (
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{season.description}</p>
            ) : (
              <p className="text-gray-500 italic text-sm md:text-base">No detailed description available for this season.</p>
            )}
          </div>
          
          {/* Score Breakdown - Mobile First */}
          <div className="lg:hidden mb-4 md:mb-6">
            <div className="p-4 md:p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-700">Score Breakdown</h3>
              <ColorCodedScoreBreakdown scores={season.scores} size="md" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 md:p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-700 flex items-center">
                <Users size={18} className="mr-2 md:hidden" />
                <Users size={20} className="mr-2 hidden md:block" />
                Contestants
              </h3>
              
              {tribes && tribes.length > 0 ? (
                <div className="space-y-4">
                  {tribes.map((tribe, tribeIndex) => (
                    <div key={tribeIndex} className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <div 
                        className="py-2 md:py-3 px-3 md:px-4 font-bold text-white"
                        style={{ backgroundColor: tribe.color }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-base md:text-lg">{tribe.name}</span>
                          <div className="text-right">
                            {tribe.location && (
                              <div className="text-xs font-normal opacity-80 hidden sm:block">{tribe.location}</div>
                            )}
                            <div className="text-xs font-normal opacity-90">
                              {tribe.members.length} {tribe.members.length === 1 ? 'member' : 'members'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 md:p-4 bg-white">
                        <div className="grid grid-cols-1 gap-2">
                          {tribe.members.map((member, memberIndex) => {
                            const memberName = typeof member === 'string' ? member : member.name;
                            const hasDetailedData = contestantData[memberName] ? true : false;
                            
                            return (
                              <button
                                key={memberIndex}
                                onClick={() => handleContestantClick(memberName)}
                                className="p-3 md:p-4 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 hover:shadow-md border border-gray-200 hover:border-gray-300 cursor-pointer touch-manipulation"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center min-w-0 flex-1">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                      style={{ backgroundColor: tribe.color }}
                                    />
                                    <span className="font-medium text-gray-800 text-sm md:text-base truncate">
                                      {memberName}
                                    </span>
                                  </div>
                                  <User size={16} className={`flex-shrink-0 ml-2 ${hasDetailedData ? "text-blue-400" : "text-gray-400"}`} />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Tap for details
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No tribe information available for this season.</p>
              )}
            </div>
            
            {/* Score Breakdown - Desktop */}
            <div className="hidden lg:block p-4 md:p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-700">Score Breakdown</h3>
              <ColorCodedScoreBreakdown scores={season.scores} size="md" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Contestant Modal */}
      <ContestantModal 
        contestant={selectedContestant}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default SeasonDetail;