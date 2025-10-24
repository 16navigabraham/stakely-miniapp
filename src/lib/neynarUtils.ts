// lib/neynarUtils.ts

/**
 * Utility functions for working with Neynar user data
 */

/**
 * Extract username from Neynar user object
 * Tries multiple properties in order of preference
 */
export function getNeynarUsername(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    // Try these properties in order
    return (
      neynarUser.username ||
      neynarUser.display_name ||
      neynarUser.displayName ||
      neynarUser.fid?.toString()
    );
  }
  
  /**
   * Extract wallet address from Neynar user object
   * Tries multiple properties in order of preference
   */
  export function getNeynarWalletAddress(neynarUser: any): string | undefined {
    if (!neynarUser) return undefined;
    
    // Try verified addresses first
    if (neynarUser.verifiedAddresses?.ethAddresses?.[0]) {
      return neynarUser.verifiedAddresses.ethAddresses[0];
    }
    
    if (neynarUser.verified_addresses?.eth_addresses?.[0]) {
      return neynarUser.verified_addresses.eth_addresses[0];
    }
    
    // Fall back to custody address
    return (
      neynarUser.custodyAddress ||
      neynarUser.custody_address
    );
  }
  
  /**
   * Check if we have the minimum required user data
   */
  export function hasRequiredNeynarData(neynarUser: any): boolean {
    const username = getNeynarUsername(neynarUser);
    const walletAddress = getNeynarWalletAddress(neynarUser);
    
    return !!(username && walletAddress);
  }
  
  /**
   * Get user display info for UI
   */
  export function getNeynarDisplayInfo(neynarUser: any) {
    return {
      username: getNeynarUsername(neynarUser),
      walletAddress: getNeynarWalletAddress(neynarUser),
      displayName: neynarUser?.display_name || neynarUser?.displayName,
      pfpUrl: neynarUser?.pfp_url || neynarUser?.pfpUrl,
      fid: neynarUser?.fid,
    };
  }