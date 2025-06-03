import React from 'react';
import { Clock } from 'lucide-react';
import { colors } from '../../data/colors';
import { unwatchedSeasons } from '../../data/unwatchedSeasons';

const UnwatchedSeasons = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Unwatched Seasons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {unwatchedSeasons.map((season) => (
          <div 
            key={season.number}
            className="p-6 rounded-xl shadow-md transition-transform hover:scale-105 bg-gradient-to-br from-gray-100 to-gray-200 border-t-4"
            style={{ borderColor: colors.blushPink }}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.blushPink }}>
                {season.number}
              </div>
              <Clock size={20} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mt-4 text-gray-800">{season.name}</h3>
            <div className="mt-1 text-sm text-gray-500">Season {season.number}</div>
            <div className="mt-4 text-gray-700">Not yet watched or ranked</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnwatchedSeasons;