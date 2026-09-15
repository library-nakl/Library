# فهرس المكتبة

A static React/Vite library catalog designed for GitHub Pages.

## Features

- Arabic RTL interface
- Search by book name, author, or section
- Filter by library type and section
- Book location: stand, shelf, number
- Data comes from `public/books.json`
- No backend or database
- GitHub Pages-friendly relative Vite base path
- Mobile-first layout for QR-code visitors
- Arabic normalization for more forgiving searches

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Update books

Edit:

```text
public/books.json
```

Then build and deploy again.

## GitHub Pages

The project uses:

```js
base: './'
```

in `vite.config.js`, so the generated static files can be served from a GitHub Pages project site.

For automatic deployment, the repository can use GitHub Actions to build `dist` and publish it to GitHub Pages.
