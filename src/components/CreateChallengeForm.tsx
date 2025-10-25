// components/CreateChallengeForm.tsx
'use client';

import { useState } from 'react';
import { useCreateChallengeWithFarcaster, STEP_MESSAGES } from '~/hooks/useCreateChallengeWithFarcaster';
import { useConnect, useDisconnect } from 'wagmi';
import type { CreateChallengeFormData } from '~/hooks/useCreateChallengeWithFarcaster';

// Contract addresses
const CONTRACT_ADDRESS = '0x...' as const; // Your GrindArena contract
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // Base USDC
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.grindarena.xyz';
const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '';

export function CreateChallengeForm() {
  // Wagmi connect/disconnect
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Challenge creation hook
  const {
    createChallenge,
    loading,
    error,
    step,
    onchainData,
    apiResponse,
    supportsPermit,
    isConnected,
    address,
    farcasterUser,
    isFullyAuthenticated,
    farcasterError,
    reset,
  } = useCreateChallengeWithFarcaster(
    CONTRACT_ADDRESS,
    USDC_ADDRESS,
    API_BASE_URL,
    NEYNAR_API_KEY
  );

  // Form state
  const [formData, setFormData] = useState<CreateChallengeFormData>({
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

  // Handle form changes
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChallenge(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Challenge</h1>

      {/* Wallet Connection */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">1. Connect Wallet</h2>
        
        {!isConnected ? (
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Farcaster Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">2. Farcaster Account</h2>
        
        {!isConnected ? (
          <p className="text-sm text-gray-500">Connect wallet first</p>
        ) : !farcasterUser ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {farcasterError ? (
                <span className="text-red-600">{farcasterError}</span>
              ) : (
                'Detecting Farcaster account...'
              )}
            </p>
            {farcasterError && (
              <a
                href="https://warpcast.com/~/settings/verified-addresses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                Verify your wallet on Warpcast →
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={farcasterUser.pfpUrl}
              alt={farcasterUser.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">@{farcasterUser.username}</p>
              <p className="text-sm text-gray-600">FID: {farcasterUser.fid}</p>
            </div>
          </div>
        )}
      </div>

      {/* Permit Support Status */}
      {isConnected && (
        <div className="mb-6 p-3 border rounded-lg bg-blue-50">
          <p className="text-sm">
            {supportsPermit === null ? (
              '🔍 Checking permit support...'
            ) : supportsPermit ? (
              '✅ Permit supported - 1 transaction required'
            ) : (
              '⚠️ Permit not supported - 2 transactions required'
            )}
          </p>
        </div>
      )}

      {/* Challenge Form */}
      {isFullyAuthenticated && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="30 Day Fitness Challenge"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="fitness">Fitness</option>
              <option value="learning">Learning</option>
              <option value="productivity">Productivity</option>
              <option value="health">Health</option>
              <option value="creative">Creative</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border rounded"
              placeholder="I will exercise for 30 minutes every day..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Win Condition</label>
            <textarea
              name="winCondition"
              value={formData.winCondition}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-3 py-2 border rounded"
              placeholder="Daily workout posts with proof..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="text"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stake Amount (USDC)</label>
              <input
                type="number"
                name="stakeAmount"
                value={formData.stakeAmount}
                onChange={handleChange}
                required
                min="1"
                step="1"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Voting Duration (hours)</label>
              <input
                type="number"
                name="votingDurationHours"
                value={formData.votingDurationHours}
                onChange={handleChange}
                required
                min="1"
                step="1"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFullyAuthenticated}
            className={`w-full py-3 px-4 rounded font-semibold ${
              loading || !isFullyAuthenticated
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? STEP_MESSAGES[step] : 'Create Challenge'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {onchainData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold mb-2">✅ Challenge Created!</p>
              <div className="text-sm space-y-1">
                <p>Challenge ID: {onchainData.challengeId}</p>
                <p>
                  Transaction:{' '}
                  <a
                    href={`https://basescan.org/tx/${onchainData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View on BaseScan
                  </a>
                </p>
              </div>
              <button
                onClick={reset}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Another Challenge
              </button>
            </div>
          )}
        </form>
      )}

      {/* Not Fully Authenticated */}
      {isConnected && !isFullyAuthenticated && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
          <p className="text-yellow-800">
            Please connect your wallet and verify your Farcaster account to continue.
          </p>
        </div>
      )}
    </div>
  );
}