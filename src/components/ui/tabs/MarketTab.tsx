// components/ui/tabs/MarketTab.tsx
"use client";
import { useEffect, useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  category: string;
  timeLeft: string;
  prize: number;
  participants: number;
}

export function MarketTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    // Load mock challenges
    setChallenges([
      {
        id: 1,
        title: "Lakers vs Warriors Winner",
        category: "Sports",
        timeLeft: "2h 45m",
        prize: 500,
        participants: 24
      },
      {
        id: 2,
        title: "Bitcoin hits $100K this week?",
        category: "Crypto",
        timeLeft: "5d 12h",
        prize: 1200,
        participants: 89
      },
      {
        id: 3,
        title: "Best Pizza in NYC",
        category: "Food",
        timeLeft: "1d 8h",
        prize: 300,
        participants: 15
      },
      {
        id: 4,
        title: "Next Marvel Movie Success",
        category: "Entertainment",
        timeLeft: "3h 20m",
        prize: 750,
        participants: 56
      }
    ]);
  }, []);

  return (
    <div className="animate-slideUp space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 
            className="text-3xl font-black text-white uppercase tracking-tight leading-none" 
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            🔥 Live Markets
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {challenges.length} active challenges
          </p>
        </div>
        <button className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/50 rounded-lg text-[#7C3AED] text-sm font-bold hover:bg-[#7C3AED]/30 active:scale-95 transition-all">
          Filter
        </button>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-br from-[#7C3AED]/20 to-purple-900/20 border border-[#7C3AED]/30 rounded-xl p-4 mb-4">
        <p className="text-white font-bold text-sm mb-1">🎯 Ready to compete?</p>
        <p className="text-gray-300 text-xs">
          Pick a challenge, stake crypto, and prove yourself!
        </p>
      </div>
      
      {/* Challenge Cards */}
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div 
            key={challenge.id} 
            className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-[#7C3AED]/50 active:scale-98 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full font-bold">
                    {challenge.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    ⏱️ {challenge.timeLeft}
                  </span>
                </div>
                <h3 className="text-white font-black text-base leading-tight">
                  {challenge.title}
                </h3>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {challenge.participants} players
              </div>
              <div className="flex items-center gap-1 text-green-400 font-bold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                ${challenge.prize}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white text-sm font-bold py-2.5 rounded-lg active:scale-95 transition-transform shadow-lg shadow-purple-500/30">
                Join Challenge
              </button>
              <button className="px-4 border border-gray-700 text-gray-300 text-sm font-bold py-2.5 rounded-lg active:scale-95 transition-transform hover:border-[#7C3AED]/50">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <button className="w-full py-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 text-sm font-bold hover:border-[#7C3AED]/50 hover:text-white active:scale-98 transition-all">
        Load More Challenges
      </button>
    </div>
  );
}