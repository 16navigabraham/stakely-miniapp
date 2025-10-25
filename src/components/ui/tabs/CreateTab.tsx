// components/ui/tabs/CreateTab.tsx
"use client";
import { useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { type Address } from "viem";
import { signPermit, formatUSDCAmount, USDC_ADDRESSES } from "~/utils/permit-wagmi";
import { getNeynarUsername, getNeynarFid, getNeynarPfpUrl } from "~/lib/neynarUtils";

// Contract addresses - from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT as Address;
const CHAIN_ID = 8453; // Base
const USDC_ADDRESS = USDC_ADDRESSES[CHAIN_ID];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface CreateTabProps {
  neynarUser: any;
  walletAddress?: Address;
  isWalletConnected: boolean;
}

type CreateStep = 
  | 'idle'
  | 'uploading_banner'
  | 'checking_permit'
  | 'signing_permit'
  | 'creating'
  | 'waiting_confirmation'
  | 'saving_to_api'
  | 'success'
  | 'error';

const STEP_MESSAGES: Record<CreateStep, string> = {
  idle: '',
  uploading_banner: '📸 Processing banner...',
  checking_permit: '🔍 Checking permit support...',
  signing_permit: '📝 Sign in your wallet...',
  creating: '⚡ Creating on blockchain...',
  waiting_confirmation: '⏳ Confirming transaction...',
  saving_to_api: '💾 Saving to database...',
  success: '✅ Challenge created!',
  error: '❌ Something went wrong',
};

const CATEGORIES = [
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'other', label: 'Other', icon: '🎯' },
];

export function CreateTab({ neynarUser, walletAddress, isWalletConnected }: CreateTabProps) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'fitness',
    description: '',
    winCondition: '',
    startDate: '',
    startTime: '00:00:00',
    endDate: '',
    endTime: '23:59:59',
    stakeAmount: 10,
    votingDurationHours: 24,
  });

  const [banner, setBanner] = useState<{
    file: File | null;
    preview: string | null;
    data: string | null;
  }>({
    file: null,
    preview: null,
    data: null,
  });

  // Transaction state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CreateStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<number | null>(null);

  // Handle form input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stakeAmount' || name === 'votingDurationHours' 
        ? Number(value) 
        : value,
    }));
  };

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setError('Banner must be JPEG or PNG');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Banner must be less than 5MB');
      return;
    }

    setError(null);
    setStep('uploading_banner');

    // Create preview
    const preview = URL.createObjectURL(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBanner({
        file,
        preview,
        data: base64.split(',')[1], // Remove data:image/...;base64, prefix
      });
      setStep('idle');
    };
    reader.readAsDataURL(file);
  };

  // Parse date/time to Unix timestamp
  const parseDateTime = (date: string, time: string): number => {
    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000);
  };

  // Check permit support
  const checkPermitSupport = async (): Promise<boolean> => {
    if (!publicClient) return false;
    try {
      await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: [{
          name: 'DOMAIN_SEPARATOR',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'bytes32' }],
        }],
        functionName: 'DOMAIN_SEPARATOR',
      });
      return true;
    } catch {
      return false;
    }
  };

  // Create with permit (1 tx)
  const createWithPermit = async () => {
    if (!walletAddress || !publicClient || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const stakeAmountWei = formatUSDCAmount(formData.stakeAmount);
    const deadline = parseDateTime(formData.endDate, formData.endTime);
    const votingDurationSeconds = formData.votingDurationHours * 3600;

    // Check balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      }],
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    if (balance < stakeAmountWei) {
      throw new Error(`Insufficient USDC. Need ${formData.stakeAmount} USDC`);
    }

    // Sign permit
    setStep('signing_permit');
    const permitSig = await signPermit(
      USDC_ADDRESS,
      walletAddress,
      CONTRACT_ADDRESS,
      stakeAmountWei,
      publicClient,
      walletClient
    );

    // Create challenge
    setStep('creating');
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        name: 'createChallengeWithPermit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'description', type: 'string' },
          { name: 'deadline', type: 'uint256' },
          { name: 'votingDuration', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'permitDeadline', type: 'uint256' },
          { name: 'v', type: 'uint8' },
          { name: 'r', type: 'bytes32' },
          { name: 's', type: 'bytes32' },
        ],
        outputs: [],
      }],
      functionName: 'createChallengeWithPermit',
      args: [
        formData.description,
        BigInt(deadline),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
        BigInt(permitSig.deadline),
        permitSig.v,
        permitSig.r,
        permitSig.s,
      ],
    });

    setTxHash(hash);
    setStep('waiting_confirmation');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const challengeIdFromLogs = Number(receipt.logs[0]?.topics[1] || '0');
    setChallengeId(challengeIdFromLogs);

    return { hash, challengeId: challengeIdFromLogs };
  };

  // Create with approval (2 txs)
  const createWithApproval = async () => {
    if (!walletAddress || !publicClient || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const stakeAmountWei = formatUSDCAmount(formData.stakeAmount);
    const deadline = parseDateTime(formData.endDate, formData.endTime);
    const votingDurationSeconds = formData.votingDurationHours * 3600;

    // Check allowance
    const currentAllowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
      }],
      functionName: 'allowance',
      args: [walletAddress, CONTRACT_ADDRESS],
    });

    // Approve if needed
    if (currentAllowance < stakeAmountWei) {
      setStep('signing_permit');
      const approveHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: [{
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        }],
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, stakeAmountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Create challenge
    setStep('creating');
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        name: 'createChallenge',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'description', type: 'string' },
          { name: 'deadline', type: 'uint256' },
          { name: 'votingDuration', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
      }],
      functionName: 'createChallenge',
      args: [
        formData.description,
        BigInt(deadline),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
      ],
    });

    setTxHash(hash);
    setStep('waiting_confirmation');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const challengeIdFromLogs = Number(receipt.logs[0]?.topics[1] || '0');
    setChallengeId(challengeIdFromLogs);

    return { hash, challengeId: challengeIdFromLogs };
  };

  // Save to backend
  const saveToBackend = async (onchainData: { hash: string; challengeId: number }) => {
    setStep('saving_to_api');

    if (!banner.data) {
      throw new Error('Banner is required');
    }

    const farcasterUsername = getNeynarUsername(neynarUser);
    const farcasterFid = getNeynarFid(neynarUser);
    const farcasterPfpUrl = getNeynarPfpUrl(neynarUser);

    const endDateTime = parseDateTime(formData.endDate, formData.endTime);
    const votingDeadlineMs = endDateTime * 1000 + formData.votingDurationHours * 3600000;

    const payload = {
      ...formData,
      Id: `${walletAddress?.toLowerCase()}_challenge${onchainData.challengeId}`,
      onchainChallengeId: onchainData.challengeId,
      txHash: onchainData.hash,
      votingDeadline: new Date(votingDeadlineMs).toISOString(),
      farcasterUsername,
      farcasterFid,
      farcasterPfpUrl,
      farcasterWalletAddress: walletAddress,
      banner: {
        filename: banner.file?.name || 'banner.jpg',
        contentType: banner.file?.type || 'image/jpeg',
        data: banner.data,
      },
    };

    const response = await fetch(`${API_BASE_URL}/api/create_challenge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletConnected || !walletAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!neynarUser) {
      setError('Farcaster account not found');
      return;
    }

    if (!banner.data) {
      setError('Please upload a banner image');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('checking_permit');
    setTxHash(null);
    setChallengeId(null);

    try {
      console.log('👤 Wallet:', walletAddress);
      console.log('🟣 Farcaster:', getNeynarUsername(neynarUser));

      const hasPermit = await checkPermitSupport();
      console.log('🔐 Permit:', hasPermit ? 'YES' : 'NO');

      let result;
      if (hasPermit) {
        try {
          result = await createWithPermit();
        } catch (permitError: any) {
          console.warn('⚠️ Permit failed, using approval');
          result = await createWithApproval();
        }
      } else {
        result = await createWithApproval();
      }

      await saveToBackend(result);

      setStep('success');
      console.log('🎉 Success!');

      // Reset after 5s
      setTimeout(() => {
        setFormData({
          title: '',
          category: 'fitness',
          description: '',
          winCondition: '',
          startDate: '',
          startTime: '00:00:00',
          endDate: '',
          endTime: '23:59:59',
          stakeAmount: 10,
          votingDurationHours: 24,
        });
        setBanner({ file: null, preview: null, data: null });
        setStep('idle');
        setTxHash(null);
        setChallengeId(null);
      }, 5000);

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to create challenge');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 
          className="text-3xl font-black text-white mb-2 uppercase tracking-tight"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          Create Challenge
        </h2>
        <p className="text-gray-400 text-sm">
          Set your goal, stake USDC, and prove yourself
        </p>
      </div>

      {/* Wallet Warning */}
      {!isWalletConnected && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-md">
          <p className="text-yellow-400 text-sm font-medium">
            ⚠️ Connect your wallet to create a challenge
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Challenge Banner *
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleBannerUpload}
              disabled={loading}
              className="hidden"
              id="banner-upload"
            />
            <label
              htmlFor="banner-upload"
              className={`
                block w-full h-40 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-300 overflow-hidden
                ${banner.preview 
                  ? 'border-[#7C3AED]' 
                  : 'border-gray-700 hover:border-[#7C3AED]/50'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {banner.preview ? (
                <img 
                  src={banner.preview} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Click to upload banner</p>
                  <p className="text-xs mt-1">JPEG or PNG, max 5MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
            maxLength={100}
            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md"
            placeholder="30 Day Fitness Challenge"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Category *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                disabled={loading}
                className={`
                  p-3 rounded-xl border-2 transition-all duration-300 text-center
                  ${formData.category === cat.id
                    ? 'bg-gradient-to-br from-[#7C3AED] to-[#a855f7] border-[#7C3AED] text-white'
                    : 'bg-black/40 border-gray-700 text-gray-400 hover:border-[#7C3AED]/50'
                  }
                `}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs font-bold">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={loading}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md resize-none"
            placeholder="I will exercise for 30 minutes every day for 30 days..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Win Condition */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Win Condition *
          </label>
          <textarea
            name="winCondition"
            value={formData.winCondition}
            onChange={handleChange}
            required
            disabled={loading}
            rows={2}
            maxLength={300}
            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md resize-none"
            placeholder="Post daily workout proof on Farcaster with #30DayChallenge"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Start Date *
            </label>
            <input
              type="text"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="DD/MM/YYYY"
              className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              End Date *
            </label>
            <input
              type="text"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="DD/MM/YYYY"
              className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md"
            />
          </div>
        </div>

        {/* Stake & Voting */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Stake (USDC) *
            </label>
            <input
              type="number"
              name="stakeAmount"
              value={formData.stakeAmount}
              onChange={handleChange}
              required
              disabled={loading}
              min="1"
              step="1"
              className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Voting (hours) *
            </label>
            <input
              type="number"
              name="votingDurationHours"
              value={formData.votingDurationHours}
              onChange={handleChange}
              required
              disabled={loading}
              min="1"
              step="1"
              className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#7C3AED] transition-colors backdrop-blur-md"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isWalletConnected || !banner.data}
          className={`
            w-full group relative overflow-hidden px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider
            transition-all duration-300 border-2
            ${loading || !isWalletConnected || !banner.data
              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white border-[#7C3AED] shadow-lg shadow-purple-500/50 hover:scale-[1.02]'
            }
          `}
        >
          {loading ? STEP_MESSAGES[step] : 'Create Challenge'}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-md animate-slideDown">
            <p className="text-red-400 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && txHash && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-md animate-slideDown">
            <p className="text-green-400 font-bold mb-2 text-center">
              ✅ Challenge Created!
            </p>
            <div className="text-sm text-white/80 space-y-1 text-center">
              <p>Challenge ID: {challengeId}</p>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7C3AED] hover:underline inline-block"
              >
                View on BaseScan →
              </a>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}