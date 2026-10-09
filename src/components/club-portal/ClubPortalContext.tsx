'use client';

import { createContext, useContext } from 'react';

// --- CLUB PORTAL CONTEXT -----------------------------------------------------
// The portal layout loads the signed-in club once and shares it with every
// portal page. readOnly is true while the club is suspended.

export interface ClubPortal {
  club: any;
  userId: string;
  email: string;
  readOnly: boolean;
  reload: () => Promise<void>;
}

export const ClubPortalContext = createContext<ClubPortal | null>(null);

export function useClubPortal(): ClubPortal {
  const value = useContext(ClubPortalContext);
  if (!value) throw new Error('useClubPortal must be used inside the club portal');
  return value;
}
