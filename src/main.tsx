import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { verifyAppComponentImports } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error(
    '[JAIN-PAY BOOTSTRAP] Fatal error: #root DOM container not found in index.html.'
  );
  throw new Error('Root container #root missing in index.html');
}

// 1. Verify all imported components in App.tsx loaded without circular dependencies
verifyAppComponentImports();

console.info(
  '[JAIN-PAY BOOTSTRAP] Initializing React 19 root and BCNF Ledger Workspace...'
);

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// 2. Post-mount diagnostic check verifying Tailwind CSS & design tokens via window.getComputedStyle(rootElement)
requestAnimationFrame(() => {
  const computedRootStyle = window.getComputedStyle(rootElement);
  const bgVoidToken = computedRootStyle.getPropertyValue('--bg-void').trim();
  const accentOrangeToken = computedRootStyle
    .getPropertyValue('--accent-orange')
    .trim();
  const boxSizing = computedRootStyle.boxSizing;
  const fontFamily = computedRootStyle.fontFamily;
  const textColor = computedRootStyle.color;

  const isTailwindApplied =
    boxSizing === 'border-box' &&
    Boolean(bgVoidToken) &&
    Boolean(accentOrangeToken);

  if (isTailwindApplied) {
    console.info(
      `[JAIN-PAY CSS DIAGNOSTICS] Tailwind CSS & Design System styles verified on #root via window.getComputedStyle(rootElement) | boxSizing=${boxSizing} | --bg-void=${bgVoidToken} | --accent-orange=${accentOrangeToken} | color=${textColor} | fontFamily=${fontFamily.slice(0, 42)}`
    );
  } else {
    console.warn(
      `[JAIN-PAY CSS DIAGNOSTICS] Stylesheet check incomplete on #root | boxSizing=${boxSizing} | --bg-void=${bgVoidToken || 'unset'}`
    );
  }
});


