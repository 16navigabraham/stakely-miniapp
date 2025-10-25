// components/ui/BetModal.tsx
"use client";
import { useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  banner: string;
  category: string;
  creator: string;
  totalStaked: number;
  yesPercentage: number;
  noPercentage: number;
  participants: number;
}

interface BetModalProps {
  challenge: Challenge;
  onClose: () => void;
  onPlaceBet: (side: 'yes' | 'no', amount: string) => void;
}

export function BetModal({ challenge, onClose, onPlaceBet }: BetModalProps) {
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');

  const handleSubmit = () => {
    if (!selectedSide || !stakeAmount) return;
    onPlaceBet(selectedSide, stakeAmount);
  };

  const potentialReturn = stakeAmount ? (parseFloat(stakeAmount) * 2).toFixed(2) : '0.00';
  const profit = stakeAmount ? parseFloat(stakeAmount).toFixed(2) : '0.00';

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>
      
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#1a0b2e] via-[#0f0520] to-[#0a0118] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-scaleIn border-2 border-purple-500/60"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 80px rgba(124, 58, 237, 0.6), 0 0 120px rgba(124, 58, 237, 0.4)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center text-white hover:bg-purple-500 hover:scale-110 transition-all shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-6 pb-4">
          <div className="mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-5xl">{challenge.banner}</div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white mb-2 leading-tight">
                  {challenge.title}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 font-bold">
                    {challenge.category}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 font-semibold">{challenge.participants} participants</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-purple-900/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider mb-1">Total Pool</p>
                    <p className="text-2xl font-black text-white">${challenge.totalStaked.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-300/70 mb-1">Current Odds</p>
                    <div className="flex gap-2">
                      <span className="text-green-400 font-bold text-sm">{challenge.yesPercentage}%</span>
                      <span className="text-gray-600">/</span>
                      <span className="text-red-400 font-bold text-sm">{challenge.noPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-2 text-white font-black text-sm mb-3 uppercase tracking-wider">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              Choose Your Side
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedSide('yes')}
                className={`relative py-6 rounded-xl font-black text-center transition-all transform hover:scale-[1.02] active:scale-95 ${
                  selectedSide === 'yes'
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-105'
                    : 'bg-green-500/10 border-2 border-green-500/40 text-green-300 hover:border-green-500/70'
                }`}
                style={{
                  boxShadow: selectedSide === 'yes' 
                    ? '0 10px 40px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)' 
                    : 'none'
                }}
              >
                {selectedSide === 'yes' && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
                )}
                <div className="relative">
                  <div className="text-4xl mb-2">✓</div>
                  <div className="text-xs mb-1 opacity-90">YES</div>
                  <div className="text-3xl font-black">{challenge.yesPercentage}%</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedSide('no')}
                className={`relative py-6 rounded-xl font-black text-center transition-all transform hover:scale-[1.02] active:scale-95 ${
                  selectedSide === 'no'
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-105'
                    : 'bg-red-500/10 border-2 border-red-500/40 text-red-300 hover:border-red-500/70'
                }`}
                style={{
                  boxShadow: selectedSide === 'no' 
                    ? '0 10px 40px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3)' 
                    : 'none'
                }}
              >
                {selectedSide === 'no' && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
                )}
                <div className="relative">
                  <div className="text-4xl mb-2">✗</div>
                  <div className="text-xs mb-1 opacity-90">NO</div>
                  <div className="text-3xl font-black">{challenge.noPercentage}%</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-2 text-white font-black text-sm mb-3 uppercase tracking-wider">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Stake Amount
            </label>
            
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-0 focus-within:opacity-30 transition-opacity"></div>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="relative w-full bg-black/60 border-2 border-purple-500/40 focus:border-purple-500 rounded-xl pl-12 pr-5 py-4 text-white placeholder-gray-600 font-black text-3xl outline-none transition-all"
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-400 font-black text-3xl pointer-events-none">$</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStakeAmount(amount.toString())}
                  className={`py-3 rounded-lg text-sm font-black transition-all transform hover:scale-105 ${
                    stakeAmount === amount.toString()
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:border-purple-500/60'
                  }`}
                  style={{
                    boxShadow: stakeAmount === amount.toString() 
                      ? '0 5px 15px rgba(124, 58, 237, 0.4)' 
                      : 'none'
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {stakeAmount && selectedSide && (
            <div className="relative animate-slideUp mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-900/40 to-teal-900/40 backdrop-blur-xl border-2 border-green-400/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-200 font-bold text-sm uppercase tracking-wider">
                      Potential Win
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-2xl">💰</span>
                    <span className="text-white font-black text-3xl">
                      ${potentialReturn}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-green-400/30">
                  <span className="text-green-200 font-semibold">Your Profit if You Win</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-black text-xl">+${profit}</span>
                    <span className="text-xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-purple-500/30 bg-gradient-to-t from-black/80 to-transparent p-5">
          <button
            onClick={handleSubmit}
            disabled={!stakeAmount || !selectedSide}
            className={`relative w-full py-5 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 overflow-hidden group ${
              stakeAmount && selectedSide
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white hover:scale-[1.02] active:scale-98 shadow-2xl'
                : 'bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed'
            }`}
            style={{
              boxShadow: stakeAmount && selectedSide 
                ? '0 10px 50px rgba(124, 58, 237, 0.7), 0 0 100px rgba(124, 58, 237, 0.4)' 
                : 'none'
            }}
          >
            {stakeAmount && selectedSide && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
              </>
            )}
            <span className="relative flex items-center justify-center gap-3">
              {stakeAmount && selectedSide ? (
                <>
                  <span className="text-3xl animate-bounce">🚀</span>
                  <span>Place Your Bet</span>
                  <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>💰</span>
                </>
              ) : (
                <>
                  <span className="text-xl">⚡</span>
                  <span className="text-base">Select Side & Amount</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}