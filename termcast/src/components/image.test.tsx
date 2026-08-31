import { describe, expect, test } from 'bun:test'
import { fittedImageCellSize, resolveImageLike } from 'termcast/src/components/image'
import { Icon } from 'termcast/src/components/icon'

describe('resolveImageLike', () => {
  test('treats built-in icons and emoji as glyphs', () => {
    expect(resolveImageLike({ image: Icon.Circle })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "○",
      }
    `)
    expect(resolveImageLike({ image: 'circle-16' })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "○",
      }
    `)
    expect(resolveImageLike({ image: '🍎' })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "🍎",
      }
    `)
    expect(resolveImageLike({ image: { fileIcon: '/tmp/file.png' } })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "▤",
      }
    `)
  })

  test('treats urls, data uris, paths, and asset files as rasters', () => {
    expect(
      resolveImageLike({ image: 'https://example.com/avatar.png' }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "https://example.com/avatar.png",
      }
    `)
    expect(
      resolveImageLike({
        image: 'data:image/png;base64,aaa',
      }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "data:image/png;base64,aaa",
      }
    `)
    expect(
      resolveImageLike({ image: '/tmp/photo.jpg' }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "/tmp/photo.jpg",
      }
    `)
    expect(
      resolveImageLike({
        image: 'icon.png',
        assetsPath: '/ext/assets',
      }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "/ext/assets/icon.png",
      }
    `)
  })

  test('resolves theme sources, fallback, and nested value objects', () => {
    expect(
      resolveImageLike({
        image: {
          source: { light: 'light.png', dark: 'dark.png' },
        },
        appearance: 'dark',
        assetsPath: '/ext/assets',
      }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "/ext/assets/dark.png",
      }
    `)
    expect(
      resolveImageLike({
        image: {
          source: 'https://example.com/missing.png',
          fallback: Icon.Circle,
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "fallback": {
          "kind": "glyph",
          "text": "○",
        },
        "kind": "raster",
        "source": "https://example.com/missing.png",
      }
    `)
    expect(
      resolveImageLike({
        image: { value: 'https://example.com/avatar.png', tooltip: 'Avatar' },
      }),
    ).toMatchInlineSnapshot(`
      {
        "kind": "raster",
        "source": "https://example.com/avatar.png",
      }
    `)
  })

  test('fits square images into cell boxes without stretch', () => {
    expect(
      fittedImageCellSize({
        sourceWidth: 475,
        sourceHeight: 475,
        maxWidth: 20,
        maxHeight: 10,
        cellAspectRatio: 2,
      }),
    ).toMatchInlineSnapshot(`
      {
        "height": 10,
        "width": 20,
      }
    `)
    expect(
      fittedImageCellSize({
        sourceWidth: 400,
        sourceHeight: 300,
        maxWidth: 40,
        maxHeight: 10,
        cellAspectRatio: 2,
      }),
    ).toMatchInlineSnapshot(`
      {
        "height": 10,
        "width": 27,
      }
    `)
  })

  test('returns empty glyph for nullish input', () => {
    expect(resolveImageLike({ image: null })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "",
      }
    `)
    expect(resolveImageLike({ image: undefined })).toMatchInlineSnapshot(`
      {
        "kind": "glyph",
        "text": "",
      }
    `)
  })
})
