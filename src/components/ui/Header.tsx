"use client";

import { useState } from "react";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniApp } from "@neynar/react";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
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
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Neynar Score: {neynarUser.score}
                      </p>
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
