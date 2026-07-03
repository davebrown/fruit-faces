import {
  imageHasTag,
  indexImages,
  mix,
  getNextImage,
  getPreviousImage,
  getAboveImage,
  getBelowImage
} from '../imageUtils.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeImage(base, opts = {}) {
  return {
    base,
    root: opts.root || '/user1',
    full: opts.full || `${base}.jpg`,
    tags: opts.tags || [],
    ...(opts.path ? { path: opts.path } : {}),
    ...(opts.index !== undefined ? { index: opts.index } : {})
  };
}

/** Create an indexed array of N images with sequential indices. */
function makeGrid(n) {
  const images = [];
  for (let i = 0; i < n; i++) {
    images.push(makeImage(`img${i}`, { full: `img${i}.png`, index: i }));
  }
  // indexImages sets .path and .index
  indexImages(images);
  return images;
}

// ---------------------------------------------------------------------------
// imageHasTag
// ---------------------------------------------------------------------------

describe('imageHasTag', () => {
  test('finds an existing tag', () => {
    expect(imageHasTag({ tags: ['a', 'b'] }, 'b')).toBe(true);
  });

  test('returns false for missing tag', () => {
    expect(imageHasTag({ tags: ['a'] }, 'z')).toBe(false);
  });

  test('returns false for null image', () => {
    expect(imageHasTag(null, 'a')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// indexImages
// ---------------------------------------------------------------------------

describe('indexImages', () => {
  test('builds path from root + base when path is missing', () => {
    const imgs = [makeImage('apple')];
    const map = indexImages(imgs);
    expect(imgs[0].path).toBe('/user1/apple');
    expect(map['/user1/apple']).toBe(imgs[0]);
  });

  test('preserves existing path', () => {
    const imgs = [makeImage('apple', { path: '/custom/path' })];
    const map = indexImages(imgs);
    expect(imgs[0].path).toBe('/custom/path');
    expect(map['/custom/path']).toBe(imgs[0]);
  });

  test('assigns sequential indices', () => {
    const imgs = [makeImage('a'), makeImage('b'), makeImage('c')];
    indexImages(imgs);
    expect(imgs.map(i => i.index)).toEqual([0, 1, 2]);
  });

  test('extracts file extension from full filename', () => {
    const imgs = [
      makeImage('a', { full: 'photo.jpg' }),
      makeImage('b', { full: 'image.png' }),
      makeImage('c', { full: 'pic.with.dots.gif' })
    ];
    indexImages(imgs);
    expect(imgs[0].ext).toBe('jpg');
    expect(imgs[1].ext).toBe('png');
    expect(imgs[2].ext).toBe('gif');
  });

  test('returns empty map for empty array', () => {
    expect(indexImages([])).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// mix
// ---------------------------------------------------------------------------

describe('mix', () => {
  test('interleaves two equal-length arrays', () => {
    const a = [{ id: 'a1' }, { id: 'a2' }];
    const b = [{ id: 'b1' }, { id: 'b2' }];
    const result = mix([a, b]);
    expect(result.map(r => r.id)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });

  test('handles arrays of different lengths', () => {
    const a = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }];
    const b = [{ id: 'b1' }];
    const result = mix([a, b]);
    expect(result.map(r => r.id)).toEqual(['a1', 'b1', 'a2', 'a3']);
  });

  test('sets correct index on each element', () => {
    const a = [{ id: 'a1' }];
    const b = [{ id: 'b1' }];
    const result = mix([a, b]);
    expect(result[0].index).toBe(0);
    expect(result[1].index).toBe(1);
  });

  test('returns empty array for empty input arrays', () => {
    expect(mix([[], []])).toEqual([]);
  });

  test('interleaves three arrays', () => {
    const a = [{ id: 'a1' }];
    const b = [{ id: 'b1' }];
    const c = [{ id: 'c1' }];
    const result = mix([a, b, c]);
    expect(result.map(r => r.id)).toEqual(['a1', 'b1', 'c1']);
  });
});

// ---------------------------------------------------------------------------
// Navigation: getNextImage / getPreviousImage
// ---------------------------------------------------------------------------

describe('getNextImage', () => {
  test('returns the next image in the array', () => {
    const imgs = makeGrid(5);
    expect(getNextImage(imgs, imgs[2])).toBe(imgs[3]);
  });

  test('wraps around from last to first', () => {
    const imgs = makeGrid(5);
    expect(getNextImage(imgs, imgs[4])).toBe(imgs[0]);
  });

  test('returns null when no selectedImage', () => {
    const imgs = makeGrid(5);
    expect(getNextImage(imgs, null)).toBeNull();
  });
});

describe('getPreviousImage', () => {
  test('returns the previous image', () => {
    const imgs = makeGrid(5);
    expect(getPreviousImage(imgs, imgs[3])).toBe(imgs[2]);
  });

  test('wraps around from first to last', () => {
    const imgs = makeGrid(5);
    expect(getPreviousImage(imgs, imgs[0])).toBe(imgs[4]);
  });

  test('returns null when no selectedImage', () => {
    const imgs = makeGrid(5);
    expect(getPreviousImage(imgs, null)).toBeNull();
  });

  test('returns null when images array is empty', () => {
    expect(getPreviousImage([], { index: 0 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Navigation: getAboveImage / getBelowImage (2D grid)
// ---------------------------------------------------------------------------

describe('getAboveImage', () => {
  // Grid layout with mapWidth=4 and 8 images:
  //   row 0: [0] [1] [2] [3]
  //   row 1: [4] [5] [6] [7]

  test('moves up one row in the grid', () => {
    const imgs = makeGrid(8);
    const result = getAboveImage(imgs, imgs[5], 4);
    expect(result).toBe(imgs[1]); // row 1 col 1 → row 0 col 1
  });

  test('wraps from top row to bottom', () => {
    const imgs = makeGrid(8);
    // index 1 (row 0, col 1) → going up wraps to row 1 col 0
    const result = getAboveImage(imgs, imgs[1], 4);
    expect(result).toBe(imgs[4]);
  });

  test('returns null when no selectedImage', () => {
    const imgs = makeGrid(8);
    expect(getAboveImage(imgs, null, 4)).toBeNull();
  });
});

describe('getBelowImage', () => {
  test('moves down one row in the grid', () => {
    const imgs = makeGrid(8);
    const result = getBelowImage(imgs, imgs[1], 4);
    expect(result).toBe(imgs[5]); // row 0 col 1 → row 1 col 1
  });

  test('wraps from bottom row to top', () => {
    const imgs = makeGrid(8);
    // index 5 (row 1, col 1) → going down wraps to col 2 at top
    const result = getBelowImage(imgs, imgs[5], 4);
    expect(result).toBe(imgs[2]);
  });

  test('returns null when no selectedImage', () => {
    const imgs = makeGrid(8);
    expect(getBelowImage(imgs, null, 4)).toBeNull();
  });
});
