// =============================================================================
// sprites.js — Pixel palette + 16×16 bitmap frames for Dog, Cat, Bunny
//
// GRID: 16 rows × 16 cols. Each char → PAL color. '.' = transparent.
// Renderer scales each cell to (canvasSize / 16) px using fillRect.
// =============================================================================

export const PAL = {
  '.': null,
  'W': '#f8f6f2',  // white
  'C': '#fbefd5',  // cream / belly
  'K': '#1c1a18',  // black (eyes, outline)
  'L': '#f2bc60',  // light golden-brown (dog body)
  'M': '#c8843a',  // mid brown (ear shadow)
  'D': '#8b5a1c',  // dark brown (nose, mouth)
  'E': '#f9d9a0',  // pale tan (face flash)
  'R': '#e03030',  // red (collar / mouth)
  'G': '#f0cc30',  // gold (tag)
  'A': '#ccc8c2',  // light gray (cat body)
  'B': '#9a9490',  // mid gray (cat stripes)
  'N': '#5c5850',  // dark gray (whisker, closed eye)
  'X': '#3a3630',  // charcoal (cat outline)
  'U': '#7050a8',  // purple (cat collar)
  'V': '#b090d8',  // lavender
  'P': '#f8b4c0',  // light pink (bunny ear inner, cheek)
  'Q': '#e06070',  // deep pink (bunny nose)
  'H': '#ff5577',  // heart
  'S': '#ffdd22',  // sparkle
  'Z': '#88ccff',  // zzz blue
};

// =============================================================================
// DOG — golden / shiba mix
// =============================================================================
export const DOG = {
  idle0: [
    '....MMLLLLMM....',
    '...MLLLLLLLLM...',
    '..MLLEEEEEELLM..',
    '..MLEEKKEEEEL M.',
    '..MLEEEEEEEELM..',
    '..MLEEEDDEEEL M.',
    '..MLLEEEEEELLM..',
    '...MLLLLLLLLM...',
    '...LRRRRRRRRL...',
    '..LLRGGGGGLL....',
    '..LLLLLLLLLL....',
    '..LLEEEEEEELL...',
    '..LLEEEEEEELL...',
    '..LLLL....LLLL..',
    '..LLL......LLL..',
    '..MM........MM..',
  ],
  blink: [
    '....MMLLLLMM....',
    '...MLLLLLLLLM...',
    '..MLLEEEEEELLM..',
    '..MLEDDDDDDEEL M',
    '..MLEEEEEEEELM..',
    '..MLEEEDDEEEL M.',
    '..MLLEEEEEELLM..',
    '...MLLLLLLLLM...',
    '...LRRRRRRRRL...',
    '..LLRGGGGGLL....',
    '..LLLLLLLLLL....',
    '..LLEEEEEEELL...',
    '..LLEEEEEEELL...',
    '..LLLL....LLLL..',
    '..LLL......LLL..',
    '..MM........MM..',
  ],
  mouth: [
    '....MMLLLLMM....',
    '...MLLLLLLLLM...',
    '..MLLEEEEEELLM..',
    '..MLEEKKEEEEL M.',
    '..MLEEEEEEEELM..',
    '..MLEEEDDEEEL M.',
    '..MLLEDRRDELLM..',
    '...MLLRRRRLLLM..',
    '...LRRRRRRRRL...',
    '..LLRGGGGGLL....',
    '..LLLLLLLLLL....',
    '..LLEEEEEEELL...',
    '..LLEEEEEEELL...',
    '..LLLL....LLLL..',
    '..LLL......LLL..',
    '..MM........MM..',
  ],
  happyBlink: [
    '....MMLLLLMM....',
    '...MLLLLLLLLM...',
    '..MLLEEEEEELLM..',
    '..MLEDDDDDDEEL M',
    '..MLEEEEEEEELM..',
    '..MLEEEDDEEEL M.',
    '..MLLEDRRDELLM..',
    '...MLLRRRRLLLM..',
    '...LRRRRRRRRL...',
    '..LLRGGGGGLL....',
    '..LLLLLLLLLL....',
    '..LLEEEEEEELL...',
    '..LLEEEEEEELL...',
    '..LLLL....LLLL..',
    '..LLL......LLL..',
    '..MM........MM..',
  ],
  sleep: [
    '................',
    '................',
    '.....MMLLMM.....',
    '....MLLLLLLM....',
    '...MLLEEELLM....',
    '...MLEDDELM.....',
    '...MLLEELLM.....',
    '...LLLLLLLLLM...',
    '..LLEEEEEEEELL..',
    '..LEEEEEEEEEELL.',
    '..LLLLLLLLLLLL..',
    '...MMMLLLLMMM...',
    '................',
    '................',
    '................',
    '................',
  ],
};

// =============================================================================
// CAT — tabby / tuxedo
// =============================================================================
export const CAT = {
  idle0: [
    '...XAAAAAAAAX...',
    '.XBA..........ABX',
    '.XBAAAAAAAAABX..',
    '..XAAAWWWAAAX...',
    '..XAAKKWWKKAX...',
    '..XAAWWWWWAAX...',
    '.NXAAAWWWAAAXN..',
    '..XAAAWQWAAAX...',
    '..XAUUUUUUAX....',
    '..XAVGGGGVAX....',
    '..XAAAAAAAX.....',
    '..XAAWWWWAX.....',
    '..XAAAAAAAX.....',
    '...XAAA.AAX.....',
    '..XAAA...AAAX...',
    '..XBB.....BBX...',
  ],
  blink: [
    '...XAAAAAAAAX...',
    '.XBA..........ABX',
    '.XBAAAAAAAAABX..',
    '..XAAAWWWAAAX...',
    '..XAANNWWNNAX...',
    '..XAAWWWWWAAX...',
    '.NXAAAWWWAAAXN..',
    '..XAAAWQWAAAX...',
    '..XAUUUUUUAX....',
    '..XAVGGGGVAX....',
    '..XAAAAAAAX.....',
    '..XAAWWWWAX.....',
    '..XAAAAAAAX.....',
    '...XAAA.AAX.....',
    '..XAAA...AAAX...',
    '..XBB.....BBX...',
  ],
  mouth: [
    '...XAAAAAAAAX...',
    '.XBA..........ABX',
    '.XBAAAAAAAAABX..',
    '..XAAAWWWAAAX...',
    '..XAAKKWWKKAX...',
    '..XAAWWWWWAAX...',
    '.NXAAAWWWAAAXN..',
    '..XAAAWQWAAAX...',
    '..XAAAWRWAAAX...',
    '..XAUUUUUUAX....',
    '..XAAAAAAAX.....',
    '..XAAWWWWAX.....',
    '..XAAAAAAAX.....',
    '...XAAA.AAX.....',
    '..XAAA...AAAX...',
    '..XBB.....BBX...',
  ],
  happyBlink: [
    '...XAAAAAAAAX...',
    '.XBA..........ABX',
    '.XBAAAAAAAAABX..',
    '..XAAAWWWAAAX...',
    '..XAANNWWNNAX...',
    '..XAAWWWWWAAX...',
    '.NXAAAWWWAAAXN..',
    '..XAAAWQWAAAX...',
    '..XAAAWRWAAAX...',
    '..XAUUUUUUAX....',
    '..XAAAAAAAX.....',
    '..XAAWWWWAX.....',
    '..XAAAAAAAX.....',
    '...XAAA.AAX.....',
    '..XAAA...AAAX...',
    '..XBB.....BBX...',
  ],
  sleep: [
    '................',
    '................',
    '.....XAAAAX.....',
    '....XBAAAABX....',
    '....XAAAANAX....',
    '....XANNNAAX....',
    '....XAAAAQAX....',
    '....XAAAAAX.....',
    '....XAAAAAAAAAX.',
    '....XAWWWWAAAAX.',
    '....XAAAAAAAAX..',
    '.....XBBBBBBX...',
    '................',
    '................',
    '................',
    '................',
  ],
};

// =============================================================================
// BUNNY — white holland lop
// =============================================================================
export const BUNNY = {
  idle0: [
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..',
    '..WWWKWWWWKWWW..',
    '..WWWWPPPPWWWW..',
    '..WWWWWQQWWWWW..',
    '..WWWWWWWWWWWW..',
    '..WWWCCCCCCWWW..',
    '..WWCCCCCCCCWW..',
    '..WWWCCCCCCWWW..',
    '..WWWWW..WWWWW..',
    '..WWWW....WWWW..',
    '..CCWW....WWCC..',
  ],
  blink: [
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..',
    '..WWWNWWWWNWWW..',
    '..WWWWPPPPWWWW..',
    '..WWWWWQQWWWWW..',
    '..WWWWWWWWWWWW..',
    '..WWWCCCCCCWWW..',
    '..WWCCCCCCCCWW..',
    '..WWWCCCCCCWWW..',
    '..WWWWW..WWWWW..',
    '..WWWW....WWWW..',
    '..CCWW....WWCC..',
  ],
  mouth: [
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..',
    '..WWWKWWWWKWWW..',
    '..WWWWPPPPWWWW..',
    '..WWWWWQQWWWWW..',
    '..WWWWWRRWWWWW..',
    '..WWWCCCCCCWWW..',
    '..WWCCCCCCCCWW..',
    '..WWWCCCCCCWWW..',
    '..WWWWW..WWWWW..',
    '..WWWW....WWWW..',
    '..CCWW....WWCC..',
  ],
  happyBlink: [
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..',
    '..WWWNWWWWNWWW..',
    '..WWWWPPPPWWWW..',
    '..WWWWWQQWWWWW..',
    '..WWWWWRRWWWWW..',
    '..WWWCCCCCCWWW..',
    '..WWCCCCCCCCWW..',
    '..WWWCCCCCCWWW..',
    '..WWWWW..WWWWW..',
    '..WWWW....WWWW..',
    '..CCWW....WWCC..',
  ],
  sleep: [
    '................',
    '....WWPWWPWW....',
    '....WWPWWPWW....',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..',
    '..WWWNWWWWNWWW..',
    '..WWWWPPPPWWWW..',
    '..WWWWWQQWWWWW..',
    '..WWWWWWWWWWWWWW',
    '..WWWCCCCCCCWWWW',
    '..WWWCCCCCCCWWWW',
    '..WWWWWWWWWWWWW.',
    '................',
    '................',
    '................',
    '................',
  ],
};

export const FRAME_SETS = { dog: DOG, cat: CAT, bunny: BUNNY };
export const ANIMAL_TYPES = ['dog', 'cat', 'bunny'];
export const AVATAR_STATES = ['idle','typing','talking','happy','excited','sleeping'];
