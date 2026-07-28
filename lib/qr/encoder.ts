/**
 * A self-contained QR Code encoder (ISO/IEC 18004) for byte mode at error
 * correction level M, versions 1-10. Enough for URLs, which is all we encode.
 *
 * Implemented rather than imported so share codes work offline with no
 * dependency. Output is a boolean matrix; rendering is the caller's problem.
 */

const EC_LEVEL_M_BITS = 0b00;

/** [ecCodewordsPerBlock, group1Blocks, group1Data, group2Blocks, group2Data] */
const BLOCK_TABLE: Record<number, [number, number, number, number, number]> = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};

const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

/* ------------------------------------------------------------ GF(256) math */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // primitive polynomial
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function generatorPolynomial(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], 1);
      next[j + 1] ^= gfMultiply(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: number[], ecLength: number): number[] {
  const generator = generatorPolynomial(ecLength);
  const remainder = new Array(ecLength).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecLength; i++) {
      remainder[i] ^= gfMultiply(generator[i + 1], factor);
    }
  }
  return remainder;
}

/* --------------------------------------------------------------- bit stream */

class BitBuffer {
  private bits: number[] = [];

  put(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((value >>> i) & 1);
    }
  }

  get length(): number {
    return this.bits.length;
  }

  toBytes(): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] ?? 0);
      bytes.push(byte);
    }
    return bytes;
  }
}

function dataCapacityBytes(version: number): number {
  const [, g1b, g1d, g2b, g2d] = BLOCK_TABLE[version];
  const totalData = g1b * g1d + g2b * g2d;
  const countBits = version >= 10 ? 16 : 8;
  return Math.floor((totalData * 8 - 4 - countBits) / 8);
}

function chooseVersion(byteLength: number): number {
  for (let version = 1; version <= 10; version++) {
    if (byteLength <= dataCapacityBytes(version)) return version;
  }
  throw new Error("Content too long for a version-10 QR code.");
}

/* ------------------------------------------------------------ codeword flow */

function buildCodewords(data: Uint8Array, version: number): number[] {
  const [ecPerBlock, g1b, g1d, g2b, g2d] = BLOCK_TABLE[version];
  const totalData = g1b * g1d + g2b * g2d;

  const buffer = new BitBuffer();
  buffer.put(0b0100, 4); // byte mode
  buffer.put(data.length, version >= 10 ? 16 : 8);
  for (let i = 0; i < data.length; i++) buffer.put(data[i], 8);

  // Terminator, then pad to a byte boundary, then alternating pad bytes.
  const remaining = totalData * 8 - buffer.length;
  buffer.put(0, Math.min(4, remaining));
  if (buffer.length % 8 !== 0) buffer.put(0, 8 - (buffer.length % 8));

  const bytes = buffer.toBytes();
  const PADDING = [0xec, 0x11];
  for (let i = 0; bytes.length < totalData; i++) bytes.push(PADDING[i % 2]);

  // Split into blocks, compute EC per block, then interleave.
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (let i = 0; i < g1b + g2b; i++) {
    const size = i < g1b ? g1d : g2d;
    const block = bytes.slice(offset, offset + size);
    offset += size;
    blocks.push(block);
    ecBlocks.push(reedSolomon(block, ecPerBlock));
  }

  const result: number[] = [];
  const maxDataLength = Math.max(g1d, g2d);
  for (let i = 0; i < maxDataLength; i++) {
    for (const block of blocks) if (i < block.length) result.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) result.push(block[i]);
  }
  return result;
}

/* -------------------------------------------------------------- the matrix */

type Grid = Array<Array<boolean | null>>;

function placeFunctionPatterns(grid: Grid, version: number): void {
  const size = grid.length;

  const finder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isDark =
          inRing &&
          ((r === 0 || r === 6 || c === 0 || c === 6) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        grid[rr][cc] = isDark;
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment patterns, skipping the three finder corners
  const centers = ALIGNMENT_CENTERS[version];
  for (const row of centers) {
    for (const col of centers) {
      const nearFinder =
        (row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8);
      if (nearFinder) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          grid[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }

  // Dark module
  grid[size - 8][8] = true;

  // Reserve format areas (filled later)
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (grid[8][size - 1 - i] === null) grid[8][size - 1 - i] = false;
    if (grid[size - 1 - i][8] === null) grid[size - 1 - i][8] = false;
  }

  // Version information blocks for version 7 and up
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;

    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = size - 11 + (i % 3);
      grid[row][col] = bit;
      grid[col][row] = bit;
    }
  }
}

function isFunctionModule(grid: Grid, row: number, col: number): boolean {
  return grid[row][col] !== null;
}

function placeData(grid: Grid, codewords: number[]): Array<[number, number]> {
  const size = grid.length;
  const dataPositions: Array<[number, number]> = [];
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing column

    for (let vertical = 0; vertical < size; vertical++) {
      const row = upward ? size - 1 - vertical : vertical;

      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (isFunctionModule(grid, row, col)) continue;

        const byte = codewords[bitIndex >>> 3];
        const bit = byte === undefined ? 0 : (byte >>> (7 - (bitIndex & 7))) & 1;
        grid[row][col] = bit === 1;
        dataPositions.push([row, col]);
        bitIndex++;
      }
    }
    upward = !upward;
  }
  return dataPositions;
}

const MASK_FUNCTIONS: Array<(row: number, col: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyFormatInfo(grid: Grid, mask: number): void {
  const size = grid.length;
  const data = (EC_LEVEL_M_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;

  const bitAt = (i: number) => ((bits >>> i) & 1) === 1;

  // Copy 1: down column 8, then left along row 8, around the top-left finder.
  for (let i = 0; i <= 5; i++) grid[i][8] = bitAt(i);
  grid[7][8] = bitAt(6);
  grid[8][8] = bitAt(7);
  grid[8][7] = bitAt(8);
  for (let i = 9; i < 15; i++) grid[8][14 - i] = bitAt(i);

  // Copy 2: along row 8 on the right, then up column 8 at the bottom.
  for (let i = 0; i < 8; i++) grid[8][size - 1 - i] = bitAt(i);
  for (let i = 8; i < 15; i++) grid[size - 15 + i][8] = bitAt(i);
}

function penalty(matrix: boolean[][]): number {
  const size = matrix.length;
  let score = 0;

  // Rule 1: runs of five or more
  const scanRuns = (get: (a: number, b: number) => boolean) => {
    for (let a = 0; a < size; a++) {
      let runColor = get(a, 0);
      let runLength = 1;
      for (let b = 1; b < size; b++) {
        const value = get(a, b);
        if (value === runColor) {
          runLength++;
        } else {
          if (runLength >= 5) score += 3 + (runLength - 5);
          runColor = value;
          runLength = 1;
        }
      }
      if (runLength >= 5) score += 3 + (runLength - 5);
    }
  };
  scanRuns((r, c) => matrix[r][c]);
  scanRuns((c, r) => matrix[r][c]);

  // Rule 2: 2x2 blocks of one colour
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns with a 4-module gap
  const PATTERN = [true, false, true, true, true, false, true, false, false, false, false];
  const matches = (values: boolean[], start: number, reverse: boolean) => {
    for (let i = 0; i < PATTERN.length; i++) {
      const expected = reverse ? PATTERN[PATTERN.length - 1 - i] : PATTERN[i];
      if (values[start + i] !== expected) return false;
    }
    return true;
  };
  for (let a = 0; a < size; a++) {
    const row: boolean[] = [];
    const col: boolean[] = [];
    for (let b = 0; b < size; b++) {
      row.push(matrix[a][b]);
      col.push(matrix[b][a]);
    }
    for (let start = 0; start + PATTERN.length <= size; start++) {
      if (matches(row, start, false) || matches(row, start, true)) score += 40;
      if (matches(col, start, false) || matches(col, start, true)) score += 40;
    }
  }

  // Rule 4: deviation from an even balance of dark and light
  let dark = 0;
  for (const row of matrix) for (const cell of row) if (cell) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

export interface QrResult {
  matrix: boolean[][];
  size: number;
  version: number;
}

export function encodeQr(text: string): QrResult {
  const data = new TextEncoder().encode(text);
  const version = chooseVersion(data.length);
  const size = version * 4 + 17;
  const codewords = buildCodewords(data, version);

  const base: Grid = Array.from({ length: size }, () => new Array(size).fill(null));
  placeFunctionPatterns(base, version);
  const dataPositions = placeData(base, codewords);

  let best: boolean[][] | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const candidate: Grid = base.map((row) => [...row]);
    const maskFn = MASK_FUNCTIONS[mask];

    for (const [row, col] of dataPositions) {
      if (maskFn(row, col)) candidate[row][col] = !candidate[row][col];
    }
    applyFormatInfo(candidate, mask);

    const matrix = candidate.map((row) => row.map((cell) => cell === true));
    const score = penalty(matrix);
    if (score < bestScore) {
      bestScore = score;
      best = matrix;
    }
  }

  return { matrix: best!, size, version };
}
