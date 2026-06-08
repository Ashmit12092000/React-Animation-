import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ── Register custom fonts as CSS @font-face so static text uses the same
//    font files as the animation engine (opentype.js loads these same TTFs).
//    Without this, `font-family: 'Open Sans'` falls back to the system
//    sans-serif, which looks completely different from the animated paths.
const CSS_FONTS = [
  { family: 'Open Sans',      url: '/OpenSans-Regular.ttf',      weight: '400', style: 'normal' },
  { family: 'Pacifico',       url: '/Pacifico-Regular.ttf',       weight: '400', style: 'normal' },
  { family: 'Caveat',         url: '/Caveat-Regular.ttf',         weight: '400', style: 'normal' },
  { family: 'Dancing Script', url: '/DancingScript-Regular.ttf',  weight: '400', style: 'normal' },
];

const base = process.env.PUBLIC_URL || '';
Promise.all(
  CSS_FONTS.map(({ family, url, weight, style }) => {
    const ff = new FontFace(family, `url(${base}${url})`, { weight, style });
    return ff.load().then(loaded => {
      document.fonts.add(loaded);
    }).catch(err => console.warn(`Font load failed: ${family}`, err));
  })
).catch(() => {});  // never block render

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);