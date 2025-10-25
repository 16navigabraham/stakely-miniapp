// hooks/useFarcasterAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { type Address } from 'viem';

// ============================================
// FARCASTER SDK TYPES
// ============================================

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  custody_address: string;
  verifications: string[];
}

export interface FarcasterAuthResult {
  user: FarcasterUser;
  signature: string;
  message: string;
  timestamp: number;
}

export interface UseFarcasterAuthResult {
  // State
  farcasterUser: FarcasterUser | null;
  isLoadingFarcaster: boolean;
  farcasterError: string | null;
  
  // Methods
  authenticateWithFarcaster: () => Promise<void>;
  linkWalletToFarcaster: () => Promise<void>;
  verifyFarcasterSigner: () => Promise<boolean>;
  disconnectFarcaster: () => void;
  
  // Combined wallet + Farcaster status
  isFullyAuthenticated: boolean;
}

// ============================================
// FARCASTER API HELPERS
// ============================================

/**
 * Fetch Farcaster user data from Neynar API
 */
async function fetchFarcasterUser(fid: number, apiKey: string): Promise<FarcasterUser | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) return null;

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      custody_address: user.custody_address,
      verifications: user.verifications || [],
    };
  } catch (error) {
    console.error('Failed to fetch Farcaster user:', error);
    return null;
  }
}

/**
 * Verify if a wallet address is verified on Farcaster for a given FID
 */
async function verifyWalletOnFarcaster(
  fid: number,
  address: Address,
  apiKey: string
): Promise<boolean> {
  try {
    const user = await fetchFarcasterUser(fid, apiKey);
    if (!user) return false;

    // Check if address is in verifications (case-insensitive)
    const addressLower = address.toLowerCase();
    return user.verifications.some(v => v.toLowerCase() === addressLower);
  } catch (error) {
    console.error('Failed to verify wallet on Farcaster:', error);
    return false;
  }
}

/**
 * Sign in with Farcaster (SIWF)
 * This creates a message that proves the user controls the Farcaster account
 */
async function signInWithFarcaster(
  fid: number,
  signMessage: (message: string) => Promise<string>
): Promise<FarcasterAuthResult | null> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `Sign in to GrindArena with Farcaster\n\nFID: ${fid}\nTimestamp: ${timestamp}`;
    
    const signature = await signMessage(message);
    
    // In production, you'd verify this signature with your backend
    // For now, we'll return the auth result
    return {
      user: null as any, // Will be populated after fetching user data
      signature,
      message,
      timestamp,
    };
  } catch (error) {
    console.error('Failed to sign Farcaster message:', error);
    return null;
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useFarcasterAuth(
  neynarApiKey: string,
  autoConnect: boolean = false
): UseFarcasterAuthResult {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [isLoadingFarcaster, setIsLoadingFarcaster] = useState(false);
  const [farcasterError, setFarcasterError] = useState<string | null>(null);

  // ============================================
  // AUTHENTICATE WITH FARCASTER
  // ============================================

  const authenticateWithFarcaster = useCallback(async () => {
    if (!isConnected || !address) {
      setFarcasterError('Please connect your wallet first');
      return;
    }

    setIsLoadingFarcaster(true);
    setFarcasterError(null);

    try {
      // Step 1: Get FID from wallet address
      // In production, you'd query Neynar or your own API
      // For now, we'll use a mock implementation
      
      // Option A: Use Neynar bulk user lookup by verification address
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to find Farcaster account for this wallet');
      }

      const data = await response.json();
      const userAccounts = data[address.toLowerCase()];

      if (!userAccounts || userAccounts.length === 0) {
        throw new Error('No Farcaster account found for this wallet. Please verify your wallet on Farcaster first.');
      }

      // Use the first account (primary)
      const user = userAccounts[0];
      
      const farcasterUserData: FarcasterUser = {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        bio: user.profile?.bio?.text,
        custody_address: user.custody_address,
        verifications: user.verifications || [],
      };

      setFarcasterUser(farcasterUserData);
      
      // Store in localStorage for persistence
      localStorage.setItem('farcaster_user', JSON.stringify(farcasterUserData));
      
      console.log('✅ Authenticated with Farcaster:', farcasterUserData);
    } catch (error: any) {
      console.error('❌ Farcaster auth error:', error);
      setFarcasterError(error.message || 'Failed to authenticate with Farcaster');
      setFarcasterUser(null);
    } finally {
      setIsLoadingFarcaster(false);
    }
  }, [isConnected, address, neynarApiKey]);

  // ============================================
  // LINK WALLET TO FARCASTER
  // ============================================

  const linkWalletToFarcaster = useCallback(async () => {
    if (!isConnected || !address) {
      setFarcasterError('Please connect your wallet first');
      return;
    }

    setFarcasterError(null);

    try {
      // Sign a message to prove wallet ownership
      const message = `Link wallet ${address} to Farcaster account`;
      await signMessageAsync({ message });

      // In production, you'd send this to your backend which would:
      // 1. Verify the signature
      // 2. Call Farcaster API to add verification
      // 3. Wait for confirmation

      alert('To link your wallet to Farcaster:\n\n1. Go to Warpcast > Settings > Verified Addresses\n2. Add your wallet address\n3. Sign the verification message\n4. Come back and try again');
      
    } catch (error: any) {
      console.error('Failed to link wallet:', error);
      setFarcasterError(error.message || 'Failed to link wallet to Farcaster');
    }
  }, [isConnected, address, signMessageAsync]);

  // ============================================
  // VERIFY FARCASTER SIGNER
  // ============================================

  const verifyFarcasterSigner = useCallback(async (): Promise<boolean> => {
    if (!farcasterUser || !address) return false;

    try {
      const isVerified = await verifyWalletOnFarcaster(
        farcasterUser.fid,
        address,
        neynarApiKey
      );

      if (!isVerified) {
        setFarcasterError('Wallet not verified on Farcaster');
      }

      return isVerified;
    } catch (error) {
      console.error('Failed to verify Farcaster signer:', error);
      return false;
    }
  }, [farcasterUser, address, neynarApiKey]);

  // ============================================
  // DISCONNECT FARCASTER
  // ============================================

  const disconnectFarcaster = useCallback(() => {
    setFarcasterUser(null);
    setFarcasterError(null);
    localStorage.removeItem('farcaster_user');
    console.log('🔌 Disconnected from Farcaster');
  }, []);

  // ============================================
  // AUTO-CONNECT FROM LOCALSTORAGE
  // ============================================

  useEffect(() => {
    if (autoConnect && isConnected && !farcasterUser) {
      const stored = localStorage.getItem('farcaster_user');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          setFarcasterUser(userData);
          console.log('🔄 Restored Farcaster session:', userData.username);
        } catch (error) {
          console.error('Failed to restore Farcaster session:', error);
          localStorage.removeItem('farcaster_user');
        }
      }
    }
  }, [autoConnect, isConnected, farcasterUser]);

  // Clear Farcaster data when wallet disconnects
  useEffect(() => {
    if (!isConnected && farcasterUser) {
      disconnectFarcaster();
    }
  }, [isConnected, farcasterUser, disconnectFarcaster]);

  // ============================================
  // COMPUTED STATE
  // ============================================

  const isFullyAuthenticated = isConnected && farcasterUser !== null;

  return {
    farcasterUser,
    isLoadingFarcaster,
    farcasterError,
    authenticateWithFarcaster,
    linkWalletToFarcaster,
    verifyFarcasterSigner,
    disconnectFarcaster,
    isFullyAuthenticated,
  };
}

// ============================================
// ALTERNATIVE: USE FARCASTER AUTH KIT (RECOMMENDED)
// ============================================

/**
 * If you want to use the official Farcaster Auth Kit, here's how:
 * 
 * 1. Install: npm install @farcaster/auth-kit
 * 
 * 2. Setup provider:
 * 
 * import { AuthKitProvider } from '@farcaster/auth-kit';
 * 
 * <AuthKitProvider
 *   config={{
 *     rpcUrl: 'https://mainnet.optimism.io',
 *     domain: 'grindarena.xyz',
 *     siweUri: 'https://grindarena.xyz',
 *   }}
 * >
 *   <App />
 * </AuthKitProvider>
 * 
 * 3. Use in component:
 * 
 * import { useSignIn, useProfile } from '@farcaster/auth-kit';
 * 
 * const { signIn, signOut, isSuccess } = useSignIn();
 * const { isAuthenticated, profile } = useProfile();
 * 
 * // Sign in
 * await signIn();
 * 
 * // Access profile
 * console.log(profile?.fid, profile?.username);
 */