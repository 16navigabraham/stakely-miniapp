// components/ui/tabs/RewardsTab.tsx
"use client";

export function RewardsTab() {
  return (
    <div className="animate-slideUp">
      <h2 
        className="text-3xl font-black text-white mb-4 uppercase tracking-tight" 
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        💎 Rewards
      </h2>
      <div className="bg-gradient-to-br from-[#7C3AED]/20 to-purple-900/20 border border-[#7C3AED]/30 rounded-xl p-6 mb-4">
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Total Earnings</p>
        <p className="text-white font-black text-4xl mb-4" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>$0.00</p>
        <button className="w-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white text-sm font-bold py-3 rounded-xl active:scale-95 transition-transform">
          Claim Rewards
        </button>
      </div>
      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm text-center">No rewards yet</p>
        <p className="text-gray-500 text-xs text-center mt-1">Start competing to earn!</p>
      </div>
    </div>
  );
}