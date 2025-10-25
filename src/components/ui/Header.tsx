"use client";

import { useState } from "react";
import { type Address } from "viem";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniApp } from "@neynar/react";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
  walletAddress?: Address;
  isWalletConnected?: boolean;
  onDisconnect?: () => void;
};

export function Header({ 
  neynarUser, 
  walletAddress, 
  isWalletConnected,
  onDisconnect 
}: HeaderProps) {
  const { context } = useMiniApp();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <div className="relative">
      {context?.user && (
        <>      
          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 z-50 w-fit mt-1 mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 space-y-2">
                <div className="text-right">
                  <h3 
                    className="font-bold text-sm hover:underline cursor-pointer inline-block"
                    onClick={() => sdk.actions.viewProfile({ fid: context.user.fid })}
                  >
                    {context.user.displayName || context.user.username}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    @{context.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    FID: {context.user.fid}
                  </p>
                  {neynarUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Neynar Score: {neynarUser.score}
                    </p>
                  )}
                  
                  {/* Wallet Info */}
                  {isWalletConnected && walletAddress && (
                    <>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                      {onDisconnect && (
                        <button
                          onClick={() => {
                            onDisconnect();
                            setIsUserDropdownOpen(false);
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                        >
                          Disconnect Wallet
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}