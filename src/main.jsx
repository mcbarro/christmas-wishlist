import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { GroupProvider } from './group/GroupProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { ThemeProvider } from './theme/ThemeProvider';

const baseUrl = import.meta.env.BASE_URL || '/';
const basename = baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <ErrorBoundary>
          <GroupProvider>
            <BrowserRouter basename={basename}>
              <App />
            </BrowserRouter>
          </GroupProvider>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
);
