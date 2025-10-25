// components/CreateChallengeForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useCreateChallenge, STEP_MESSAGES, type CreateChallengeFormData } from '~/hooks/useCreateChallenge';
import { getApprovalStrategy, doesChainUSDCSupportPermit } from '~/utils/permit';

// ============================================
// TYPES
// ============================================

interface CreateChallengeFormProps {
  provider: any;
  signer: any;
  contractAddress: string;
  usdcAddress: string;
  apiBaseUrl: string;
  farcasterUsername: string;
  onSuccess?: (challengeId: number, txHash: string) => void;
  onCancel?: () => void;
}

// ============================================
// FORM COMPONENT
// ============================================

export function CreateChallengeForm({
  provider,
  signer,
  contractAddress,
  usdcAddress,
  apiBaseUrl,
  farcasterUsername,
  onSuccess,
  onCancel,
}: CreateChallengeFormProps) {
  // Hook
  const {
    createChallenge,
    loading,
    error,
    step,
    onchainData,
    apiResponse,
    supportsPermit,
    reset,
  } = useCreateChallenge(provider, signer, contractAddress, usdcAddress, apiBaseUrl);

  // State
  const [chainId, setChainId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'crypto',
    description: '',
    winCondition: '',
    startDate: '',
    startTime: '00:00:00',
    endDate: '',
    endTime: '23:59:59',
    stakeAmount: 100,
    votingDurationHours: 24,
    bannerFile: null as File | null,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get chain info
  useEffect(() => {
    if (provider) {
      provider.getNetwork().then((network: any) => {
        setChainId(Number(network.chainId));
      });
    }
  }, [provider]);

  // Trigger success callback
  useEffect(() => {
    if (step === 'success' && onchainData && onSuccess) {
      onSuccess(onchainData.challengeId, onchainData.txHash);
    }
  }, [step, onchainData, onSuccess]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setValidationErrors(['Only JPEG and PNG images are allowed']);
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setValidationErrors(['Image size must be less than 5MB']);
        return;
      }

      setFormData({ ...formData, bannerFile: file });
      setValidationErrors([]);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
    });
  };

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.winCondition.trim()) errors.push('Win condition is required');
    if (!formData.startDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) errors.push('Start date must be in DD/MM/YYYY format');
    if (!formData.endDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) errors.push('End date must be in DD/MM/YYYY format');
    if (!formData.startTime.match(/^\d{2}:\d{2}:\d{2}$/)) errors.push('Start time must be in HH:MM:SS format');
    if (!formData.endTime.match(/^\d{2}:\d{2}:\d{2}$/)) errors.push('End time must be in HH:MM:SS format');
    if (formData.stakeAmount <= 0) errors.push('Stake amount must be greater than 0');
    if (formData.votingDurationHours < 1) errors.push('Voting duration must be at least 1 hour');
    if (!formData.bannerFile) errors.push('Banner image is required');

    // Validate dates
    const startDateTime = parseDateTimeToMs(formData.startDate, formData.startTime);
    const endDateTime = parseDateTimeToMs(formData.endDate, formData.endTime);
    const now = Date.now();

    if (startDateTime <= now) {
      errors.push('Start date/time must be in the future');
    }

    if (endDateTime <= startDateTime) {
      errors.push('End date/time must be after start date/time');
    }

    return errors;
  };

  const parseDateTimeToMs = (date: string, time: string): number => {
    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!formData.bannerFile) {
      setValidationErrors(['Please upload a banner image']);
      return;
    }

    try {
      const bannerBase64 = await fileToBase64(formData.bannerFile);

      const challengeData: CreateChallengeFormData = {
        farcasterUsername,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        winCondition: formData.winCondition,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        stakeAmount: formData.stakeAmount,
        votingDurationHours: formData.votingDurationHours,
        banner: {
          filename: formData.bannerFile.name,
          contentType: formData.bannerFile.type,
          data: bannerBase64,
        },
      };

      await createChallenge(challengeData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      title: '',
      category: 'crypto',
      description: '',
      winCondition: '',
      startDate: '',
      startTime: '00:00:00',
      endDate: '',
      endTime: '23:59:59',
      stakeAmount: 100,
      votingDurationHours: 24,
      bannerFile: null,
    });
    setValidationErrors([]);
    setPreviewUrl(null);
    reset();
  };

  // Get current step message
  const getCurrentMessage = () => {
    if (error) return `❌ ${error}`;
    return STEP_MESSAGES[step];
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Challenge</h2>

      {/* Chain info banner */}
      {chainId && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {doesChainUSDCSupportPermit(chainId) ? (
              <>
                <span className="font-semibold">✅ Single-transaction creation enabled!</span>
                <br />
                <span className="text-xs">Your chain supports EIP-2612 Permit. You'll only need to sign once.</span>
              </>
            ) : (
              <>
                <span className="font-semibold">ℹ️ Two-transaction flow</span>
                <br />
                <span className="text-xs">Your chain requires approving USDC first, then creating the challenge.</span>
              </>
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Challenge Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Bitcoin reaches $100k"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="crypto">Crypto</option>
            <option value="tech">Technology</option>
            <option value="sports">Sports</option>
            <option value="politics">Politics</option>
            <option value="entertainment">Entertainment</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Will Bitcoin reach $100,000 by end of 2025?"
          />
        </div>

        {/* Win Condition */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Win Condition <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.winCondition}
            onChange={(e) => setFormData({ ...formData, winCondition: e.target.value })}
            disabled={loading}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Bitcoin price reaches or exceeds $100,000 on any major exchange"
          />
        </div>

        {/* Dates Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              disabled={loading}
              placeholder="24/10/2025"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">DD/MM/YYYY</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              disabled={loading}
              placeholder="08:00:00"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">HH:MM:SS</p>
          </div>
        </div>

        {/* Dates Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={loading}
              placeholder="31/12/2025"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">DD/MM/YYYY</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              disabled={loading}
              placeholder="23:59:59"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">HH:MM:SS</p>
          </div>
        </div>

        {/* Stake Amount */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Stake Amount (USDC) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.stakeAmount}
            onChange={(e) => setFormData({ ...formData, stakeAmount: Number(e.target.value) })}
            disabled={loading}
            min="1"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">Initial stake to create the challenge</p>
        </div>

        {/* Voting Duration */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Voting Duration (hours) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.votingDurationHours}
            onChange={(e) => setFormData({ ...formData, votingDurationHours: Number(e.target.value) })}
            disabled={loading}
            min="1"
            max="168"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Time after challenge ends when community votes on the outcome (1-168 hours)
          </p>
        </div>

        {/* Banner Image */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Banner Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">JPEG or PNG, max 5MB</p>
          
          {/* Image Preview */}
          {previewUrl && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="Banner preview"
                className="max-w-full h-48 object-cover rounded border border-gray-300"
              />
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress indicator */}
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-800">{getCurrentMessage()}</span>
            </div>
          </div>
        )}

        {/* Success message */}
        {step === 'success' && onchainData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium mb-2">
              ✅ Challenge Created Successfully!
            </p>
            <div className="text-sm text-green-700 space-y-1">
              <p>Challenge ID: <strong>#{onchainData.challengeId}</strong></p>
              <p>Block: <strong>#{onchainData.blockNumber}</strong></p>
              <a
                href={`https://basescan.org/tx/${onchainData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                View on Basescan →
              </a>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-1">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || step === 'success'}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              loading || step === 'success'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Creating...' : step === 'success' ? 'Created!' : 'Create Challenge'}
          </button>

          {(step === 'success' || step === 'error') && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Create Another
            </button>
          )}

          {onCancel && !loading && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}