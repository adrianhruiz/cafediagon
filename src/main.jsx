import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProveedorIdioma } from './i18n/idioma.jsx';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorIdioma>
      <App />
    </ProveedorIdioma>
  </StrictMode>,
);
