// Drop the album's audio files into public/audio/music/ and list them here.
// Any slot left empty falls back to the built-in placeholder loop.
// Files in public/ are downloadable by anyone, so use excerpts if that matters.
export interface Track {
  /** File name inside public/audio/music/, e.g. 'side-a-01.mp3'. */
  file: string;
  /** Shown as "now playing" in the corner of the screen. */
  title: string;
}

export const MUSIC: Record<'title' | 'level' | 'boss' | 'victory', Track | null> = {
  title: null,
  level: null,
  boss: null,
  victory: null,
};
