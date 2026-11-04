import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startAnalytics } from './analytics';
import '@fontsource-variable/golos-text';
import 'lenis/dist/lenis.css';
import './styles.css';

startAnalytics();

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
