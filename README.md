# farewell-web-app

A single-page web app for saying goodbye to coworkers. Each person gets their own link that opens an animated gift with a letter written for them. The interface is in Vietnamese.

## What the recipient sees

1. Press and hold the glowing orb.
2. A reveal screen shows their name (tap to skip ahead after a few seconds).
3. Tap the 3D gift box to open it.
4. A letter rises out with their personal message, your signature and your contact details.
5. They can put the letter back in the box and read it again.

If WebGL is unavailable, a flat SVG gift box replaces the 3D one. A link with a missing or unknown code shows the generic letter.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later to build. There are no packages to install.
- A modern browser to view.

## Files

| File | Purpose | Publish it? |
| --- | --- | --- |
| `people.json` | Your messages and each person's link code | **No** |
| `template.html` | Page layout, styles and animation code | No |
| `three.min.js` | Three.js (MIT), inlined into the page at build time | No |
| `build.mjs` | Build script | No |
| `farewell.html` | Generated page | **Yes, only this one** |
| `links.txt` | Generated list of personal links | **No** |

Do not edit `farewell.html` or `links.txt` by hand. The next build overwrites them.

## Quick start

### 1. Write the messages

Edit `people.json` and save it as UTF-8:

```json
{
  "from": "Your name",
  "company": "Company name",
  "contact": [
    "A closing line",
    "How to reach you"
  ],
  "generic": [
    "Shown when the link code is missing or wrong."
  ],
  "people": [
    {
      "name": "An",
      "paragraphs": [
        "First paragraph of the letter to An.",
        "Second paragraph."
      ]
    }
  ]
}
```

Leave out `token` for new people. The build creates one (for example `an-3f9c1a7be04d52c8`), saves it back into `people.json`, and reuses it afterwards so links stay the same. To replace a code, delete its `token`, rebuild and publish the new page; the old link then shows only the generic letter.

Before sending, replace any `[...]` placeholder text.

### 2. Build

```bash
node build.mjs https://your-site.example/
```

Pass the address where the page will be hosted. It is used only to write `links.txt`; without it the links start with `https://YOUR-SITE/`.

### 3. Preview locally

```bash
node build.mjs http://localhost:8000/farewell.html
python -m http.server 8000 --bind 127.0.0.1
```

The second command needs Python; any static file server works. Open a link from `links.txt`. Rebuild with your real address before sending links.

### 4. Publish and send

1. Upload **only** `farewell.html` to a static host. Rename it to `index.html` if you want links without a file name.
2. Build with the final address.
3. Send each person their own line from `links.txt`, privately.

Use HTTPS. Browsers disable the decryption API on plain HTTP (except `localhost`), so everyone would see the generic letter.

## Privacy

Each person's name and paragraphs are encrypted with AES-GCM, using a key derived from their link code (PBKDF2, 150,000 iterations). This keeps them out of "view source".

A generated code is the person's name plus 16 random hex characters (64 bits), which is impractical to guess. If you set a `token` yourself, make it long and random: the page stores a fast SHA-256 lookup value, so short codes can be found by trying them all.

**Limits:**

- `from`, `company`, `contact` and `generic` are **not** encrypted. Anyone who opens the page can read them.
- Anyone who is forwarded a link can read that letter.

Do not put anything sensitive in the messages.

## Customizing

- **Letter content:** `people.json`.
- **Interface text** (headings, hints, buttons, closing line): `template.html`, in both the markup and the script.
- **Colors and fonts:** the `:root` variables at the top of `template.html`. The 3D box and effects set their colors in the script.

Rebuild after any change. Fonts load from Google Fonts, with system fallbacks when offline.
