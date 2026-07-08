import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// Inject JWT token into every API request
setAuthTokenGetter(() => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('medimarket_token');
});

createRoot(document.getElementById('root')!).render(<App />);
