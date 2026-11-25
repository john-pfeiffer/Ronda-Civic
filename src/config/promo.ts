// Everything band-facing lives here so it can be changed without touching game code.
export const PROMO = {
  band: 'RONDA CIVIC',
  /** Working title: swap for the album or single name if this is promoting a release. */
  gameTitle: 'HOG WILD',
  tagline: 'Big Boy took Joanne. Go get her back.',
  /** Shown on the victory screen. Leave `url` empty to hide a button. */
  links: [
    { label: 'LISTEN', url: '' },
    { label: 'FOLLOW', url: '' },
    { label: 'SHOWS + MERCH', url: '' },
  ] as { label: string; url: string }[],
};
