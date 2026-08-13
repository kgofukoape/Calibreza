'use client';

import React from 'react';
import AdBanner, { AdPage } from '@/components/AdBanner';

// ─── IN-FEED AD ROTATOR ──────────────────────────────────────────────────────
// Drops an advert into a listings grid every `every` items, cycling through the
// three feed-eligible slots so each booking gets its turn in front of readers.
//
// WHY THE SIDEBAR SLOTS APPEAR HERE
// A sidebar booking is one product that runs on every device: a 160×600
// skyscraper in the desktop sidebar column, and — via this component — a wide
// banner between listings on phones and tablets, which is where most of the
// traffic is. The `2xl:hidden` wrapper means only one of the two ever shows, so
// the advertiser is never double-counted, and AdBanner's viewability check
// records an impression only when the ad is genuinely on screen.
//
// Usage inside a .map():
//   <React.Fragment key={item.id}>
//     <SomeCard ... />
//     <InFeedAd index={idx} page={adPage} />
//   </React.Fragment>

interface InFeedAdProps {
  /** Zero-based index of the item just rendered */
  index: number;
  page: AdPage;
  /** Insert an ad after every N items. Default 6. */
  every?: number;
  /** Extra classes for the wrapper (e.g. col-span-full in a grid) */
  className?: string;
}

export default function InFeedAd({ index, page, every = 6, className = 'col-span-full' }: InFeedAdProps) {
  const position = index + 1;
  if (position % every !== 0) return null;

  // Which of the three feed slots is this one's turn?
  const cycle = (position / every) % 3;

  return (
    <div className={`${className} flex justify-center py-2`}>
      {cycle === 1 && <AdBanner slot="leaderboard_mid" page={page} />}

      {cycle === 2 && (
        <div className="2xl:hidden w-full flex justify-center">
          <AdBanner slot="sidebar_left" page={page} variant="infeed" />
        </div>
      )}

      {cycle === 0 && (
        <div className="2xl:hidden w-full flex justify-center">
          <AdBanner slot="sidebar_right" page={page} variant="infeed" />
        </div>
      )}
    </div>
  );
}
