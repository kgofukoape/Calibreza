// ─── LISTING COLLECTIONS ─────────────────────────────────────────────────────
// A collection is a curated view across every listing on the platform, built
// from matching rules rather than from a category a seller picked. It exists so
// gunx.co.za/1911 can be a page in its own right — something to post in an
// enthusiast group and something Google can rank — rather than a filtered
// search URL nobody would share.
//
// Built as a registry rather than a one-off page: if the 1911 works, the next
// one is an entry in this file instead of a new page.
//
// ─── WHY MATCHING IS TWO-TIERED ─────────────────────────────────────────────
// Most makers on a 1911 list also build things that are emphatically not 1911s.
// Sig, Smith & Wesson, Ruger, Taurus, Springfield, Remington, Walther, Colt and
// Rock River all make striker-fired polymer pistols. Matching on the maker name
// alone would fill a 1911 page with P320s and M&P Shields, which is worse than
// having no page at all.
//
//   EXCLUSIVE_MAKERS   Build 1911-pattern pistols and essentially nothing else.
//                      The maker's name alone is enough.
//
//   PATTERN_TERMS      Words that identify a 1911 regardless of who made it.
//                      Required for every maker not on the exclusive list.
//
// A listing matches when it names an exclusive maker, or contains a pattern
// term. Nothing else qualifies.

export interface Collection {
    slug: string;
    /** Displayed as the page title. */
    name: string;
    tagline: string;
    /** One paragraph for the page and for search engine descriptions. */
    intro: string;
    /** Makers whose name alone identifies the pattern. Lower case. */
    exclusiveMakers: string[];
    /** Model or title words that identify the pattern. Lower case. */
    patternTerms: string[];
    /** Explanatory sections shown beneath the listings. */
    glossary: { heading: string; items: { term: string; meaning: string }[] }[];
  }
  
  export const COLLECTION_1911: Collection = {
    slug: '1911',
    name: '1911',
    tagline: 'Every 1911 on Gun X, in one place',
    intro:
      'Designed by John Browning and adopted by the US military in 1911, the 1911 has outlived almost every pistol it was meant to replace. Single-action, all-steel in its traditional form, and still the benchmark for trigger feel more than a century later. This page collects every 1911-pattern pistol currently listed on Gun X — from Mil-Spec Government models to full custom builds — from dealers and private sellers across South Africa.',
  
    exclusiveMakers: [
      'wilson combat', 'nighthawk custom', 'nighthawk', 'les baer', 'ed brown',
      'cabot', 'staccato', 'sti', 'guncrafter', 'infinity firearms', 'svi',
      'fusion firearms', 'para-ordnance', 'para ordnance', 'para',
      'auto-ordnance', 'auto ordnance', 'bul armory', 'bul', 'tisas',
      'alchemy custom', 'chambers custom', 'rock island armory', 'rock island',
      'armscor', 'standard manufacturing', 'dan wesson',
    ],
  
    patternTerms: [
      '1911', 'm1911', '1911a1', 'm1911a1', '2011',
      'government model', 'govt model', 'mil-spec', 'milspec', 'mil spec',
      'commander', 'officer', 'gold cup', 'combat elite',
    ],
  
    glossary: [
      {
        heading: 'Sizes and patterns',
        items: [
          { term: 'Government', meaning: 'The standard full-size model with a 5-inch barrel — the original military configuration.' },
          { term: 'Commander', meaning: 'A 4.25-inch barrel on a full-size grip. Shorter to carry, same magazine capacity.' },
          { term: 'Officer', meaning: 'Compact: short barrel and shortened grip, built for concealed carry.' },
          { term: 'Mil-Spec', meaning: 'Built to military specification — traditional sights, standard controls, no custom work.' },
          { term: '2011', meaning: 'A modern double-stack development of the 1911, roughly doubling magazine capacity.' },
        ],
      },
      {
        heading: 'How a 1911 works',
        items: [
          { term: 'Single-action only', meaning: 'The trigger does one job: it releases the hammer. It does not cock it.' },
          { term: 'Grip safety', meaning: 'A lever at the back of the grip. The pistol will not fire unless your hand depresses it.' },
          { term: 'Thumb safety', meaning: 'A manual switch on the frame that locks the firing system.' },
          { term: 'Cocked and locked', meaning: 'Carried with a round chambered, hammer back and thumb safety engaged. Condition One.' },
          { term: 'Beavertail', meaning: 'An extended grip safety that protects the web of the hand from hammer bite.' },
          { term: 'Barrel bushing', meaning: 'The ring at the muzzle end of the slide that locates the barrel. A traditional 1911 feature.' },
        ],
      },
      {
        heading: 'Custom features to look for',
        items: [
          { term: 'Front strap checkering', meaning: 'A cut grid on the front of the grip for a more secure hold.' },
          { term: 'Flared magwell', meaning: 'A widened magazine opening for faster reloads.' },
          { term: 'Skeletonised trigger', meaning: 'A lightened trigger with cut-outs, for a faster reset.' },
        ],
      },
      {
        heading: 'Chamberings',
        items: [
          { term: '.45 ACP', meaning: 'The original chambering, and still the classic choice.' },
          { term: '9mm', meaning: 'More rounds, less recoil, cheaper practice — increasingly the popular option.' },
          { term: '10mm', meaning: 'Substantially more power, used for hunting and heavy field work.' },
        ],
      },
    ],
  };
  
  export const COLLECTIONS: Record<string, Collection> = {
    '1911': COLLECTION_1911,
  };
  
  export const COLLECTION_LIST: Collection[] = Object.values(COLLECTIONS);
  
  /**
   * Whether a listing belongs in a collection.
   *
   * Shared by the collection page and anywhere else that needs a count, so the
   * page and the "247 listed" badge can never disagree about what qualifies.
   */
  export function matchesCollection(
    collection: Collection,
    listing: { title?: string | null; model?: string | null; description?: string | null; makeName?: string | null },
  ): boolean {
    const make = (listing.makeName || '').toLowerCase();
  
    // A maker who builds nothing but 1911s needs no further evidence.
    if (collection.exclusiveMakers.some(m => make.includes(m))) return true;
  
    // Everyone else needs a pattern word. Title and model carry it reliably;
    // description is included because sellers often put the pattern there and the
    // model field just says "Government".
    const haystack = [listing.title, listing.model, listing.description]
      .filter(Boolean).join(' ').toLowerCase();
  
    return collection.patternTerms.some(term => haystack.includes(term));
  }