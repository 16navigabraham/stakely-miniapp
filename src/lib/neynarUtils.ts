// lib/neynarUtils.ts
// Utility functions for extracting data from Neynar user objects

/**
 * Safely extract username from Neynar user object
 */
export function getNeynarUsername(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    // Try different possible paths where username might be
    return neynarUser.username || 
           neynarUser.user?.username || 
           neynarUser.farcasterUser?.username ||
           undefined;
  }
  
  /**
   * Safely extract FID (Farcaster ID) from Neynar user object
   */
  export function getNeynarFid(neynarUser: any): number | undefined {
    if (!neynarUser) return undefined;
    
    const fid = neynarUser.fid || 
                neynarUser.user?.fid || 
                neynarUser.farcasterUser?.fid;
    
    return fid ? Number(fid) : undefined;
  }
  
  /**
   * Safely extract profile picture URL from Neynar user object
   */
  export function getNeynarPfpUrl(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    return neynarUser.pfpUrl || 
           neynarUser.pfp_url ||
           neynarUser.user?.pfpUrl || 
           neynarUser.user?.pfp_url ||
           neynarUser.farcasterUser?.pfpUrl ||
           neynarUser.farcasterUser?.pfp_url ||
           undefined;
  }
  
  /**
   * Safely extract display name from Neynar user object
   */
  export function getNeynarDisplayName(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    return neynarUser.displayName || 
           neynarUser.display_name ||
           neynarUser.user?.displayName || 
           neynarUser.user?.display_name ||
           neynarUser.farcasterUser?.displayName ||
           neynarUser.farcasterUser?.display_name ||
           getNeynarUsername(neynarUser); // Fallback to username
  }
  
  /**
   * Safely extract wallet address from Neynar user object
   */
  export function getNeynarWalletAddress(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    // Check custody address
    const custodyAddress = neynarUser.custodyAddress || 
                          neynarUser.custody_address ||
                          neynarUser.user?.custodyAddress ||
                          neynarUser.user?.custody_address;
    
    if (custodyAddress) return custodyAddress;
    
    // Check verified addresses (connected wallets)
    const verifications = neynarUser.verifications || 
                         neynarUser.user?.verifications ||
                         neynarUser.verifiedAddresses ||
                         neynarUser.verified_addresses ||
                         [];
    
    // Return first verified address
    return verifications[0];
  }
  
  /**
   * Get all verified wallet addresses from Neynar user object
   */
  export function getNeynarVerifiedAddresses(neynarUser: any): string[] {
    if (!neynarUser) return [];
    
    const verifications = neynarUser.verifications || 
                         neynarUser.user?.verifications ||
                         neynarUser.verifiedAddresses ||
                         neynarUser.verified_addresses ||
                         [];
    
    return Array.isArray(verifications) ? verifications : [];
  }
  
  /**
   * Check if a wallet address is verified on the Farcaster account
   */
  export function isAddressVerified(neynarUser: any, address: string): boolean {
    if (!neynarUser || !address) return false;
    
    const verifiedAddresses = getNeynarVerifiedAddresses(neynarUser);
    const normalizedAddress = address.toLowerCase();
    
    return verifiedAddresses.some(
      addr => addr.toLowerCase() === normalizedAddress
    );
  }
  
  /**
   * Get bio/description from Neynar user object
   */
  export function getNeynarBio(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    return neynarUser.bio || 
           neynarUser.user?.bio ||
           neynarUser.profile?.bio ||
           neynarUser.profile?.bio?.text ||
           undefined;
  }
  
  /**
   * Get follower count from Neynar user object
   */
  export function getNeynarFollowerCount(neynarUser: any): number {
    if (!neynarUser) return 0;
    
    const count = neynarUser.followerCount || 
                  neynarUser.follower_count ||
                  neynarUser.user?.followerCount ||
                  neynarUser.user?.follower_count ||
                  0;
    
    return Number(count);
  }
  
  /**
   * Get following count from Neynar user object
   */
  export function getNeynarFollowingCount(neynarUser: any): number {
    if (!neynarUser) return 0;
    
    const count = neynarUser.followingCount || 
                  neynarUser.following_count ||
                  neynarUser.user?.followingCount ||
                  neynarUser.user?.following_count ||
                  0;
    
    return Number(count);
  }
  
  /**
   * Check if Neynar user object is valid/loaded
   */
  export function isNeynarUserValid(neynarUser: any): boolean {
    return !!(neynarUser && (getNeynarUsername(neynarUser) || getNeynarFid(neynarUser)));
  }
  
  /**
   * Format Neynar user for display
   */
  export interface FormattedNeynarUser {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
    bio?: string;
    custodyAddress?: string;
    verifiedAddresses: string[];
    followerCount: number;
    followingCount: number;
  }
  
  export function formatNeynarUser(neynarUser: any): FormattedNeynarUser | null {
    if (!isNeynarUserValid(neynarUser)) return null;
    
    const fid = getNeynarFid(neynarUser);
    const username = getNeynarUsername(neynarUser);
    
    if (!fid || !username) return null;
    
    return {
      fid,
      username,
      displayName: getNeynarDisplayName(neynarUser) || username,
      pfpUrl: getNeynarPfpUrl(neynarUser),
      bio: getNeynarBio(neynarUser),
      custodyAddress: getNeynarWalletAddress(neynarUser),
      verifiedAddresses: getNeynarVerifiedAddresses(neynarUser),
      followerCount: getNeynarFollowerCount(neynarUser),
      followingCount: getNeynarFollowingCount(neynarUser),
    };
  }
  
  /**
   * Generate Warpcast profile URL
   */
  export function getWarpcastProfileUrl(usernameOrFid: string | number): string {
    return `https://warpcast.com/${usernameOrFid}`;
  }
  
  /**
   * Check if user has power badge
   */
  export function hasPowerBadge(neynarUser: any): boolean {
    if (!neynarUser) return false;
    
    return !!(
      neynarUser.powerBadge || 
      neynarUser.power_badge ||
      neynarUser.user?.powerBadge ||
      neynarUser.user?.power_badge
    );
  }
  
  // Example usage:
  /*
  import { 
    getNeynarUsername, 
    getNeynarFid, 
    formatNeynarUser,
    isAddressVerified 
  } from '~/lib/neynarUtils';
  
  function MyComponent({ neynarUser, walletAddress }) {
    const username = getNeynarUsername(neynarUser);
    const fid = getNeynarFid(neynarUser);
    const formatted = formatNeynarUser(neynarUser);
    
    const isVerified = isAddressVerified(neynarUser, walletAddress);
    
    return (
      <div>
        <p>@{username} (FID: {fid})</p>
        {isVerified && <span>✓ Verified</span>}
      </div>
    );
  }
  */