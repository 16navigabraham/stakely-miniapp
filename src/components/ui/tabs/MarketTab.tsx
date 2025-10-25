// components/ui/tabs/MarketTab.tsx
"use client";
import { useState, useEffect } from 'react';
import { BetModal } from '../BetModal';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { useMiniApp } from '@neynar/react';
import { useNeynarUser } from '~/hooks/useNeynarUser';
import { getNeynarUsername } from '~/lib/neynarUtils';
import { signPermit, formatUSDCAmount } from '~/utils/permit-wagmi';

// ============================================
// CONFIGURATION
// ============================================

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4b637CBe4B1A94CdcDE05c8BACC8C74813273CDf') as Address;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stakely-backend.onrender.com';

// ============================================
// TYPES
// ============================================

type ChallengeStatus = 'active' | 'voting' | 'completed' | 'pending' | 'cancelled';
type FilterType = 'all' | 'active' | 'pending' | 'completed';
type CategoryType = 'all' | 'sports' | 'crypto' | 'entertainment' | 'social network' | 'tech' | 'politics' | 'weather';

interface Challenge {
  id: number | string;
  title: string;
  category: string;
  challengeDetails?: string;
  description?: string;
  winCondition: string;
  creator: string;
  farcasterUsername?: string;
  currentStake: number;
  totalStaked?: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercentage: number;
  noPercentage?: number;
  participants?: number;
  status: ChallengeStatus;
  isActive: boolean;
  timeRemaining?: {
    humanReadable: string;
    expired: boolean;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  startDateTime?: string;
  endDateTime?: string;
  voteEndDateTime?: string;
  socialPlatform?: string;
  stakeAmount?: number;
  banner?: string;
}

interface MarketStats {
  totalChallenges: number;
  activeChallenges: number;
  totalStaked: number;
  categoriesCount: Record<string, number>;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// ABI DEFINITIONS
// ============================================

const USDC_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const;

const CONTRACT_ABI = [
  { name: 'stake', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_id', type: 'uint256' }, { name: '_isFor', type: 'bool' }, { name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'vote', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_id', type: 'uint256' }, { name: '_voteFor', type: 'bool' }], outputs: [] },
  { name: 'canVote', type: 'function', stateMutability: 'view', inputs: [{ name: '_id', type: 'uint256' }, { name: '_user', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { 
    name: 'getChallenge', 
    type: 'function', 
    stateMutability: 'view', 
    inputs: [{ name: '_id', type: 'uint256' }], 
    outputs: [{
      name: '', 
      type: 'tuple',
      components: [
        { name: 'description', type: 'string' },
        { name: 'creator', type: 'address' },
        { name: 'creatorWager', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'votingDeadline', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'isFinalized', type: 'bool' },
        { name: 'totalFor', type: 'uint256' },
        { name: 'totalAgainst', type: 'uint256' },
        { name: 'finalOutcome', type: 'bool' },
        { name: 'outcomeSet', type: 'bool' }
      ]
    }]
  },
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

export function MarketTab() {
  const { context } = useMiniApp();
  const { user: neynarUser } = useNeynarUser(context || undefined);
  const { address: walletAddress } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const farcasterUsername = getNeynarUsername(neynarUser) || '';

  // ============================================
  // STATE
  // ============================================
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');
  const [page, setPage] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [processingBet, setProcessingBet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // ============================================
  // CATEGORY ICONS
  // ============================================
  const categoryIcons: Record<string, string> = {
    all: '🌟',
    sports: '⚽',
    crypto: '₿',
    entertainment: '🎬',
    'social network': '📱',
    tech: '💻',
    politics: '🏛️',
    weather: '🌤️',
  };

  // ============================================
  // FETCH ON-CHAIN DATA
  // ============================================
  const fetchOnChainData = async (challengeId: number) => {
    if (!publicClient) return null;
    
    try {
      // Fetch challenge details from contract
      const challengeData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getChallenge',
        args: [BigInt(challengeId)],
      }) as any;

      const totalFor = Number(challengeData.totalFor) / 1e6; // Convert from USDC wei (6 decimals)
      const totalAgainst = Number(challengeData.totalAgainst) / 1e6;
      const totalStaked = totalFor + totalAgainst;
      
      const yesPercentage = totalStaked > 0 
        ? Math.round((totalFor / totalStaked) * 100) 
        : 50;

      return {
        totalStaked,
        totalFor,
        totalAgainst,
        yesPercentage,
        noPercentage: 100 - yesPercentage,
        isActive: challengeData.isActive,
        isFinalized: challengeData.isFinalized,
        deadline: Number(challengeData.deadline),
        votingDeadline: Number(challengeData.votingDeadline),
      };
    } catch (err) {
      console.error('Error fetching on-chain data:', err);
      return null;
    }
  };

  // ============================================
  // HELPER FUNCTION: Format Challenge Data with On-Chain Integration
  // ============================================
  const formatChallenge = async (c: any): Promise<Challenge> => {
    // Fetch on-chain data if available
    let onChainData = null;
    if (publicClient && c.id) {
      onChainData = await fetchOnChainData(typeof c.id === 'string' ? parseInt(c.id) : c.id);
    }

    // Use on-chain data if available, fallback to API data
    const totalStaked = onChainData?.totalStaked ?? c.currentStake ?? c.totalStaked ?? 0;
    const yesPercentage = onChainData?.yesPercentage ?? c.yesPercentage ?? 50;

    return {
      id: c.id || c.Id,
      title: c.title || 'Untitled Challenge',
      category: c.category || 'other',
      challengeDetails: c.challengeDetails || c.description,
      description: c.challengeDetails || c.description,
      winCondition: c.winCondition || 'No win condition specified',
      creator: c.farcasterUsername || c.creator || 'Unknown',
      farcasterUsername: c.farcasterUsername,
      currentStake: totalStaked,
      totalStaked: totalStaked,
      yesVotes: c.yesVotes || 0,
      noVotes: c.noVotes || 0,
      totalVotes: c.totalVotes || 0,
      yesPercentage: Math.max(0, Math.min(100, yesPercentage)),
      noPercentage: 100 - yesPercentage,
      participants: c.totalVotes || c.participants || 0,
      status: c.status || 'pending',
      isActive: onChainData?.isActive ?? (c.isActive !== undefined ? c.isActive : false),
      timeRemaining: c.timeRemaining,
      banner: categoryIcons[c.category] || '🎯',
      startDateTime: c.startDateTime,
      endDateTime: c.endDateTime,
      voteEndDateTime: c.voteEndDateTime,
      socialPlatform: c.socialPlatform,
      stakeAmount: c.stakeAmount,
    };
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchChallenges = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: filter === 'all' ? 'all' : filter,
      });

      if (farcasterUsername) {
        params.append('farcasterUsername', farcasterUsername);
      }

      if (category !== 'all') {
        params.append('category', category);
      }

      console.log('🔍 Fetching with params:', params.toString());
      
      const response = await fetch(`${API_BASE_URL}/api/live_market?${params}`);
      const data = await response.json();

      console.log('📊 API Response:', {
        success: data.success,
        dataCount: data.data?.length,
        marketStats: data.marketStats,
        filters: data.filters
      });

      if (data.success) {
        if (!data.data || !Array.isArray(data.data)) {
          console.warn('⚠️ No data array in response');
          setChallenges([]);
          setError('No challenges available');
          return;
        }

        // Format challenges with on-chain data (async)
        const formattedChallengesPromises = data.data.map(async (c: any) => {
          try {
            return await formatChallenge(c);
          } catch (err) {
            console.error('❌ Error formatting challenge:', c, err);
            return null;
          }
        });

        const formattedChallenges = (await Promise.all(formattedChallengesPromises)).filter(Boolean);

        console.log('✅ Formatted challenges:', formattedChallenges.length, 'challenges');
        console.log('📝 First challenge:', formattedChallenges[0]);

        setChallenges(formattedChallenges);
        
        if (data.pagination) {
          setPagination(data.pagination);
        }

        if (data.marketStats) {
          setMarketStats(data.marketStats);
        }

        if (formattedChallenges.length === 0 && data.marketStats?.totalChallenges > 0) {
          setError(`Found ${data.marketStats.totalChallenges} total challenges, but none match current filters. Try "All" status.`);
        }
      } else {
        console.error('❌ API error:', data);
        setError(data.message || 'Failed to fetch challenges');
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(page);
    const interval = setInterval(() => fetchChallenges(page), 30000);
    return () => clearInterval(interval);
  }, [page, filter, category]);

  // ============================================
  // HANDLE BET/VOTE
  // ============================================
  const handlePlaceBet = async (side: 'yes' | 'no', amount: string) => {
    if (!selectedChallenge || !walletAddress || !publicClient || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    setProcessingBet(true);
    setError(null);

    try {
      const stakeAmount = parseFloat(amount);
      const isFor = side === 'yes';
      const challengeId = typeof selectedChallenge.id === 'string' 
        ? parseInt(selectedChallenge.id) 
        : selectedChallenge.id;

      const isVoting = selectedChallenge.status === 'voting' || 
                       (selectedChallenge.timeRemaining?.expired && !selectedChallenge.isActive);

      if (!isVoting) {
        await handleStake(challengeId, isFor, stakeAmount);
      } else {
        await handleVote(challengeId, isFor, stakeAmount);
      }

      await submitVoteToAPI(challengeId, side, stakeAmount);
      await fetchChallenges(page);
      setSelectedChallenge(null);
    } catch (err: any) {
      console.error('Bet/Vote error:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setProcessingBet(false);
    }
  };

  const handleStake = async (challengeId: number, isFor: boolean, amount: number) => {
    if (!walletAddress || !publicClient || !walletClient) return;
    const stakeAmountWei = formatUSDCAmount(amount);
    const balance = await publicClient.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'balanceOf', args: [walletAddress] });
    if (balance < stakeAmountWei) throw new Error(`Insufficient USDC. Need ${amount} USDC`);
    const currentAllowance = await publicClient.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'allowance', args: [walletAddress, CONTRACT_ADDRESS] });
    if (currentAllowance < stakeAmountWei) {
      const approveHash = await walletClient.writeContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'approve', args: [CONTRACT_ADDRESS, stakeAmountWei] });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }
    const hash = await walletClient.writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'stake', args: [BigInt(challengeId), isFor, stakeAmountWei] });
    await publicClient.waitForTransactionReceipt({ hash });
  };

  const handleVote = async (challengeId: number, voteFor: boolean, stakeAmount: number) => {
    if (!walletAddress || !walletClient || !publicClient) return;
    const canVote = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'canVote', args: [BigInt(challengeId), walletAddress] });
    if (!canVote) throw new Error('You are not eligible to vote on this challenge');
    const hash = await walletClient.writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'vote', args: [BigInt(challengeId), voteFor] });
    await publicClient.waitForTransactionReceipt({ hash });
  };

  const submitVoteToAPI = async (challengeId: number, vote: 'yes' | 'no', stakeAmount: number) => {
    const response = await fetch(`${API_BASE_URL}/api/live_market`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farcasterUsername, challengeId, vote, stakeAmount }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record vote');
    }
    return response.json();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges(page);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handlePrevPage = () => { if (pagination?.hasPrev) setPage(page - 1); };
  const handleNextPage = () => { if (pagination?.hasNext) setPage(page + 1); };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-hidden flex flex-col pb-20">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">Live Market</span>
            </h1>
            {marketStats && (
              <p className="text-xs text-gray-400 mt-1">
                {marketStats.totalChallenges} total • {marketStats.activeChallenges} active • ${marketStats.totalStaked.toLocaleString()} staked
              </p>
            )}
          </div>
          
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg bg-black/40 border border-gray-700 text-white active:scale-95 transition-transform disabled:opacity-50">
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'all', label: 'All', icon: '🌟' },
            { id: 'active', label: 'Active', icon: '🔥' },
            { id: 'pending', label: 'Upcoming', icon: '⏰' },
            { id: 'completed', label: 'Ended', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setFilter(tab.id as FilterType); setPage(1); }}
              className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-xs transition-all duration-300 ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50'
                  : 'bg-black/40 border border-gray-700 text-gray-400'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button onClick={() => setShowCategories(!showCategories)} className="w-full flex items-center justify-between bg-black/40 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-bold">
            <span>{categoryIcons[category]} {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <svg className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCategories && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-gray-700 rounded-xl overflow-hidden z-50 backdrop-blur-lg">
              {(Object.keys(categoryIcons) as CategoryType[]).map((cat) => (
                <button key={cat} onClick={() => { setCategory(cat); setShowCategories(false); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
                    category === cat ? 'bg-[#7C3AED] text-white' : 'text-gray-400 hover:bg-gray-800'
                  }`}>
                  <span className="text-xl">{categoryIcons[cat]}</span>
                  <span>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  {marketStats?.categoriesCount?.[cat] && <span className="ml-auto text-xs opacity-70">{marketStats.categoriesCount[cat]}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-3 animate-slideUp">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center justify-between">
            <p className="text-white text-sm">❌ {error}</p>
            <button onClick={() => setError(null)} className="text-white opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-200">
          <p><strong>Debug Info:</strong></p>
          <p>• Challenges loaded: {challenges.length}</p>
          <p>• Filter: {filter} | Category: {category} | Page: {page}</p>
          {marketStats && <p>• Total in DB: {marketStats.totalChallenges} | Active: {marketStats.activeChallenges}</p>}
          <p>• API Status filter: {filter === 'all' ? 'all' : filter}</p>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-medium">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
            <p className="text-gray-400 mb-4">
              {filter === 'active' ? 'No currently active challenges. Try "All" or "Upcoming"!' :
               filter === 'pending' ? 'No upcoming challenges scheduled' :
               filter === 'completed' ? 'No completed challenges yet' :
               category !== 'all' ? `No challenges in ${category} category` :
               'Be the first to create a challenge!'}
            </p>
            {marketStats && marketStats.totalChallenges > 0 && filter !== 'all' && (
              <button onClick={() => { setFilter('all'); setCategory('all'); setPage(1); }}
                className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg font-bold text-sm hover:scale-105 transition-transform">
                Show All {marketStats.totalChallenges} Challenges
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} onClick={() => setSelectedChallenge(challenge)} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-black/40 border border-gray-700 rounded-xl p-4">
                <button onClick={handlePrevPage} disabled={!pagination.hasPrev}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="text-white text-sm font-bold">Page {pagination.currentPage} of {pagination.totalPages}</div>
                <button onClick={handleNextPage} disabled={!pagination.hasNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bet Modal - Only show for active/voting challenges */}
      {selectedChallenge && selectedChallenge.status !== 'pending' && (
        <BetModal
          challenge={{
            id: typeof selectedChallenge.id === 'string' ? parseInt(selectedChallenge.id) : selectedChallenge.id,
            title: selectedChallenge.title,
            banner: selectedChallenge.banner || '🎯',
            category: selectedChallenge.category,
            creator: selectedChallenge.creator || selectedChallenge.farcasterUsername || 'Unknown',
            totalStaked: selectedChallenge.currentStake || selectedChallenge.totalStaked || 0,
            yesPercentage: selectedChallenge.yesPercentage,
            noPercentage: selectedChallenge.noPercentage || (100 - selectedChallenge.yesPercentage),
            participants: selectedChallenge.totalVotes || selectedChallenge.participants || 0,
          }}
          onClose={() => setSelectedChallenge(null)}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </div>
  );
}

// ============================================
// CHALLENGE CARD COMPONENT
// ============================================

interface ChallengeCardProps {
  challenge: Challenge;
  onClick: () => void;
}

function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'active':
        return { color: 'from-green-500 to-green-600', shadow: 'shadow-green-500/50', icon: '🔥', label: 'ACTIVE' };
      case 'pending':
        return { color: 'from-yellow-500 to-yellow-600', shadow: 'shadow-yellow-500/50', icon: '⏰', label: 'UPCOMING' };
      case 'voting':
        return { color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/50', icon: '🗳️', label: 'VOTING' };
      case 'completed':
        return { color: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/50', icon: '✅', label: 'ENDED' };
      default:
        return { color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/50', icon: '⏸️', label: challenge.status.toUpperCase() };
    }
  };

  const statusBadge = getStatusBadge();
  
  // Disable click for pending/upcoming challenges
  const isClickable = challenge.status !== 'pending';
  const handleClick = () => {
    if (isClickable) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick} 
      className={`relative bg-gradient-to-br from-[#1a0b2e]/80 to-[#0f0520]/80 backdrop-blur-md border-2 border-purple-500/30 rounded-xl p-4 transition-all duration-300 ${
        isClickable 
          ? 'cursor-pointer hover:border-purple-500/60 hover:scale-[1.02] active:scale-[0.98]' 
          : 'cursor-not-allowed opacity-70'
      }`}
      style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.2)' }}>
      
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${statusBadge.color} text-white shadow-lg ${statusBadge.shadow}`}>
          {statusBadge.icon} {statusBadge.label}
        </div>
      </div>

      {/* Challenge Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-4xl flex-shrink-0">{challenge.banner}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white mb-1 leading-tight">{challenge.title}</h3>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 font-bold">{challenge.category}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-semibold">{challenge.totalVotes} votes</span>
            {challenge.creator && challenge.creator !== 'Unknown' && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-xs">by @{challenge.creator}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">Total Staked</p>
          <p className="text-xl font-black text-white">${challenge.currentStake.toFixed(2)}</p>
        </div>
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">Time</p>
          <p className="text-sm font-bold text-white truncate">{challenge.timeRemaining?.humanReadable || 'N/A'}</p>
        </div>
      </div>

      {/* Odds Bar */}
      <div className="relative h-8 bg-black/40 rounded-lg overflow-hidden mb-2">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500" style={{ width: `${challenge.yesPercentage}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-black">
          <span className="text-white drop-shadow-lg">YES {challenge.yesPercentage}%</span>
          <span className="text-white drop-shadow-lg">NO {100 - challenge.yesPercentage}%</span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isClickable) onClick(); 
        }}
        disabled={!isClickable}
        className={`w-full py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all duration-300 ${
          isClickable
            ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
        style={{ 
          boxShadow: isClickable ? '0 4px 15px rgba(124, 58, 237, 0.5)' : 'none' 
        }}>
        {challenge.status === 'voting' ? '🗳️ Cast Vote' : 
         challenge.status === 'active' ? '💰 Place Stake' : 
         challenge.status === 'pending' ? '⏰ Coming Soon' : 
         '📊 View Details'}
      </button>
    </div>
  );
}