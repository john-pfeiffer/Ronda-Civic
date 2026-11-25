# Music

Put the album's audio files here (MP3 or OGG), then list them in `src/config/music.ts`:

```ts
export const MUSIC = {
  title:   { file: 'intro.mp3',     title: 'Ronda Civic - Song Name' },
  level:   { file: 'level.mp3',     title: 'Ronda Civic - Song Name' },
  boss:    { file: 'boss.mp3',      title: 'Ronda Civic - Song Name' },
  victory: { file: 'victory.mp3',   title: 'Ronda Civic - Song Name' },
};
```

Each track loops for as long as its part of the game lasts. Any slot left as `null` plays a built-in placeholder beat.

Everything in this folder is published with the game, so anyone can download these files. Use excerpts or lower-bitrate exports if that matters.
