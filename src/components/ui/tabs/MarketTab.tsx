// components/ui/tabs/MarketTab.tsx
"use client";
import { useEffect, useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  banner: string;
  category: string;
  creator: string;
  endTime: Date;
  totalStaked: number;
  yesPercentage: number;
  noPercentage: number;
  participants: number;
}

const CATEGORIES = ['All', 'Sports', 'Crypto', 'Entertainment', 'Social Media', 'Tech', 'Politics', 'Weather'];

export function MarketTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load mock challenges with future dates
    const now = new Date();
    setChallenges([
      {
        id: 1,
        title: "Lakers vs Warriors - Will Lakers win?",
        banner: "🏀",
        category: "Sports",
        creator: "@SportsBetter",
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000),
        totalStaked: 1500,
        yesPercentage: 65,
        noPercentage: 35,
        participants: 24,
      },
      {
        id: 2,
        title: "Bitcoin hits $100K this week?",
        banner: "₿",
        category: "Crypto",
        creator: "@CryptoKing",
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
        totalStaked: 5200,
        yesPercentage: 45,
        noPercentage: 55,
        participants: 89,
      },
      {
        id: 3,
        title: "Elon Musk will tweet about Mars today?",
        banner: "🚀",
        category: "Social Media",
        creator: "@SpaceWatcher",
        endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000 + 20 * 60 * 1000),
        totalStaked: 800,
        yesPercentage: 80,
        noPercentage: 20,
        participants: 15,
      },
      {
        id: 4,
        title: "Next Marvel Movie will gross $1B+?",
        banner: "🎬",
        category: "Entertainment",
        creator: "@MovieBuff",
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        totalStaked: 2100,
        yesPercentage: 72,
        noPercentage: 28,
        participants: 56,
      },
      {
        id: 5,
        title: "Will it rain in NYC tomorrow?",
        banner: "🌧️",
        category: "Weather",
        creator: "@WeatherPro",
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        totalStaked: 450,
        yesPercentage: 38,
        noPercentage: 62,
        participants: 12,
      },
      {
        id: 6,
        title: "Will Apple announce new product this month?",
        banner: "📱",
        category: "Tech",
        creator: "@TechGuru",
        endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        totalStaked: 3200,
        yesPercentage: 55,
        noPercentage: 45,
        participants: 67,
      }
    ]);
  }, []);

  const filteredChallenges = selectedCategory === 'All' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  const handleBuyClick = (challenge: Challenge, side: 'yes' | 'no') => {
    setSelectedChallenge(challenge);
    setSelectedSide(side);
  };

  const handlePlaceBet = () => {
    if (!stakeAmount || !selectedChallenge || !selectedSide) return;
    
    console.log({
      challenge: selectedChallenge.id,
      side: selectedSide,
      amount: parseFloat(stakeAmount)
    });
    
    // Reset with animation
    setSelectedChallenge(null);
    setSelectedSide(null);
    setStakeAmount('');
  };

  const handleShare = async (challenge: Challenge) => {
    const shareData = {
      title: challenge.title,
      text: `Check out this challenge: ${challenge.title} - ${challenge.yesPercentage}% say Yes!`,
      url: `https://app.com/challenge/${challenge.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen pb-40">
      <div className="animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 
              className="text-3xl font-black text-white uppercase tracking-tight leading-none" 
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              🔥 Live Markets
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {filteredChallenges.length} active predictions
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg text-sm font-bold active:scale-95 transition-all ${
              showFilters 
                ? 'bg-[#7C3AED] border-[#7C3AED] text-white' 
                : 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/30'
            }`}
          >
            {showFilters ? '✓ Filter' : 'Filter'}
          </button>
        </div>

        {/* Filter Categories */}
        {showFilters && (
          <div className="mb-4 animate-slideUp">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-black/40 border border-gray-700 text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Challenge Cards */}
        <div className="space-y-3">
          {filteredChallenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden hover:border-[#7C3AED]/50 transition-all"
            >
              {/* Banner with Category & Countdown */}
              <div className="relative bg-gradient-to-br from-[#7C3AED]/20 to-purple-900/20 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center text-2xl flex-shrink-0">
                  {challenge.banner}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 bg-black/40 text-[#7C3AED] rounded-full font-bold uppercase">
                      {challenge.category}
                    </span>
                  </div>
                  <h3 className="text-white font-black text-sm leading-tight mb-2">
                    {challenge.title}
                  </h3>
                  <CountdownTimer endTime={challenge.endTime} />
                </div>
                
                {/* Share Button */}
                <button
                  onClick={() => handleShare(challenge)}
                  className="p-2 rounded-lg bg-black/40 border border-gray-700 text-gray-300 hover:text-white hover:border-[#7C3AED]/50 active:scale-95 transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>

              {/* Stats Row */}
              <div className="px-4 py-2 bg-black/20 border-b border-gray-800 flex items-center justify-between text-xs">
                <div className="text-gray-400">
                  by <span className="text-[#7C3AED] font-bold">{challenge.creator}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    👥 {challenge.participants}
                  </span>
                  <span className="text-green-400 font-bold">
                    💰 ${challenge.totalStaked}
                  </span>
                </div>
              </div>

              {/* Yes/No Options */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Yes Button */}
                  <button
                    onClick={() => handleBuyClick(challenge, 'yes')}
                    className="group bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-lg p-3 active:scale-95 transition-all hover:border-green-400"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-black text-xs uppercase">Yes</span>
                      <span className="text-green-400 font-black text-lg">{challenge.yesPercentage}%</span>
                    </div>
                    <div className="text-green-400 text-xs font-bold">
                      Support
                    </div>
                  </button>

                  {/* No Button */}
                  <button
                    onClick={() => handleBuyClick(challenge, 'no')}
                    className="group bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-lg p-3 active:scale-95 transition-all hover:border-red-400"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-black text-xs uppercase">No</span>
                      <span className="text-red-400 font-black text-lg">{challenge.noPercentage}%</span>
                    </div>
                    <div className="text-red-400 text-xs font-bold">
                      Oppose
                    </div>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${challenge.yesPercentage}%` }}
                  />
                </div>

                {/* End Date */}
                <div className="mt-2 text-center text-xs text-gray-500">
                  Ends: {challenge.endTime.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-sm">No challenges found in this category</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white font-bold rounded-lg active:scale-95 transition-all"
            >
              View All
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredChallenges.length > 0 && (
          <button className="w-full mt-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 text-sm font-bold hover:border-[#7C3AED]/50 hover:text-white active:scale-98 transition-all">
            Load More Markets
          </button>
        )}
      </div>

      {/* STUNNING BET MODAL OVERLAY */}
      {selectedChallenge && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          style={{
            background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15), rgba(0, 0, 0, 0.95))',
            backdropFilter: 'blur(12px)'
          }}
          onClick={() => {
            setSelectedChallenge(null);
            setSelectedSide(null);
            setStakeAmount('');
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div 
            className="relative bg-gradient-to-br from-[#1a0f3a] via-[#0a0118] to-[#1a0f3a] border-2 border-[#7C3AED] rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-500/50 animate-scaleIn"
            style={{
              boxShadow: '0 0 60px rgba(124, 58, 237, 0.4), 0 0 100px rgba(124, 58, 237, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing Header */}
            <div className="flex-shrink-0 relative border-b border-purple-500/30 p-5 flex items-center justify-between overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/20 via-purple-600/20 to-[#7C3AED]/20 animate-shimmer"></div>
              
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center animate-pulse">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                  </svg>
                </div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(124, 58, 237, 0.8)' }}>
                  Place Your Bet
                </h3>
              </div>
              
              <button
                onClick={() => {
                  setSelectedChallenge(null);
                  setSelectedSide(null);
                  setStakeAmount('');
                }}
                className="relative p-2.5 rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white active:scale-90 transition-all group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="absolute inset-0 rounded-xl bg-red-500/20 scale-0 group-hover:scale-100 transition-transform blur"></span>
              </button>
            </div>

            {/* Scrollable Content with Glass Effect */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-5 space-y-5">
                {/* Challenge Info Card with Glow */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/60 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#a855f7] rounded-xl blur-md"></div>
                        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center text-3xl">
                          {selectedChallenge.banner}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-base leading-tight mb-2">
                          {selectedChallenge.title}
                        </h4>
                        <CountdownTimer endTime={selectedChallenge.endTime} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Selection with 3D Effect */}
                <div>
                  <label className="flex items-center gap-2 text-white font-bold text-sm mb-4 uppercase tracking-wider">
                    <span className="w-1 h-5 bg-gradient-to-b from-[#7C3AED] to-[#a855f7] rounded-full"></span>
                    Choose Your Side
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* YES Button */}
                    <button
                      onClick={() => setSelectedSide('yes')}
                      className={`relative p-6 rounded-2xl font-black uppercase transition-all duration-300 transform hover:scale-105 ${
                        selectedSide === 'yes'
                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-105'
                          : 'bg-black/40 border-2 border-green-500/30 text-gray-400 hover:border-green-500/60'
                      }`}
                      style={{
                        boxShadow: selectedSide === 'yes' 
                          ? '0 10px 40px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)' 
                          : 'none'
                      }}
                    >
                      {selectedSide === 'yes' && (
                        <div className="absolute inset-0 rounded-2xl bg-green-400/20 animate-ping"></div>
                      )}
                      <div className="relative">
                        <div className="text-4xl mb-2 animate-bounce">✓</div>
                        <div className="text-sm mb-1">YES</div>
                        <div className="text-2xl font-black">{selectedChallenge.yesPercentage}%</div>
                      </div>
                    </button>

                    {/* NO Button */}
                    <button
                      onClick={() => setSelectedSide('no')}
                      className={`relative p-6 rounded-2xl font-black uppercase transition-all duration-300 transform hover:scale-105 ${
                        selectedSide === 'no'
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-105'
                          : 'bg-black/40 border-2 border-red-500/30 text-gray-400 hover:border-red-500/60'
                      }`}
                      style={{
                        boxShadow: selectedSide === 'no' 
                          ? '0 10px 40px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)' 
                          : 'none'
                      }}
                    >
                      {selectedSide === 'no' && (
                        <div className="absolute inset-0 rounded-2xl bg-red-400/20 animate-ping"></div>
                      )}
                      <div className="relative">
                        <div className="text-4xl mb-2 animate-bounce" style={{ animationDelay: '0.1s' }}>✗</div>
                        <div className="text-sm mb-1">NO</div>
                        <div className="text-2xl font-black">{selectedChallenge.noPercentage}%</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount Input with Glow */}
                <div>
                  <label className="flex items-center gap-2 text-white font-bold text-sm mb-4 uppercase tracking-wider">
                    <span className="w-1 h-5 bg-gradient-to-b from-[#7C3AED] to-[#a855f7] rounded-full"></span>
                    Stake Amount
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                    <div className="relative flex items-center">
                      <div className="absolute left-5 text-[#7C3AED] font-black text-3xl">$</div>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        className="w-full bg-black/60 backdrop-blur-xl border-2 border-purple-500/30 focus:border-[#7C3AED] rounded-2xl pl-12 pr-5 py-5 text-white placeholder-gray-600 font-black text-2xl outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Quick amounts with hover effect */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[10, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setStakeAmount(amount.toString())}
                        className={`relative py-3 rounded-xl text-sm font-black transition-all transform hover:scale-110 ${
                          stakeAmount === amount.toString()
                            ? 'bg-gradient-to-br from-[#7C3AED] to-[#a855f7] text-white'
                            : 'bg-black/40 border-2 border-purple-500/30 text-gray-300 hover:border-purple-500/60'
                        }`}
                        style={{
                          boxShadow: stakeAmount === amount.toString() 
                            ? '0 5px 20px rgba(124, 58, 237, 0.4)' 
                            : 'none'
                        }}
                      >
                        ${amount}
                        {stakeAmount === amount.toString() && (
                          <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Potential Return with Animation */}
                {stakeAmount && selectedSide && (
                  <div className="relative group animate-slideUp">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] via-purple-500 to-[#a855f7] rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-[#7C3AED]/40 to-[#a855f7]/40 backdrop-blur-xl border-2 border-purple-400/50 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-200 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Potential Win
                        </span>
                        <div className="flex items-center gap-2">
                          <svg className="w-6 h-6 text-yellow-400 animate-spin-slow" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-white font-black text-3xl animate-pulse">
                            ${(parseFloat(stakeAmount) * 2).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Your profit if you win</span>
                        <span className="text-green-400 font-black text-xl">+{parseFloat(stakeAmount).toFixed(2)} 🚀</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Epic Place Bet Button */}
            <div className="flex-shrink-0 p-5 border-t border-purple-500/30 bg-gradient-to-t from-black via-[#0a0118] to-transparent">
              <button
                onClick={handlePlaceBet}
                disabled={!stakeAmount || !selectedSide}
                className={`relative w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-300 overflow-hidden group ${
                  stakeAmount && selectedSide
                    ? 'bg-gradient-to-r from-[#7C3AED] via-purple-600 to-[#a855f7] text-white hover:scale-105 active:scale-95'
                    : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: stakeAmount && selectedSide 
                    ? '0 10px 40px rgba(124, 58, 237, 0.6), 0 0 60px rgba(124, 58, 237, 0.3)' 
                    : 'none'
                }}
              >
                {stakeAmount && selectedSide && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-2xl"></div>
                  </>
                )}
                <span className="relative flex items-center justify-center gap-3">
                  {stakeAmount && selectedSide ? (
                    <>
                      <span className="text-3xl animate-bounce">🚀</span>
                      <span>Place Bet Now</span>
                      <span className="text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>💰</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Select Your Options</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let display = '';
      if (days > 0) display += `${days}d `;
      if (hours > 0 || days > 0) display += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) display += `${minutes}m `;
      display += `${seconds}s`;

      setTimeLeft(display.trim());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg backdrop-blur-sm">
      <span className="text-xs text-orange-400 font-black uppercase flex items-center gap-1">
        <span className="animate-pulse">⏱️</span>
        {timeLeft}
      </span>
    </div>
  );
}