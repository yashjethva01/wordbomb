import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './hooks/useGameState';
import { useSocket } from './hooks/useSocket';
import Toast from './components/ui/Toast';

const HomePage = lazy(() => import('./pages/HomePage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const WinnerPage = lazy(() => import('./pages/WinnerPage'));

// Keep AppRouter inside BrowserRouter so useNavigate works in useSocket.
// We mount useSocket once at the root so socket listeners stay active
// no matter which page is currently visible.
function AppRouter() {
  useSocket();

  const fallback = (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
      }}
      aria-live="polite"
    >
      Loading arena...
    </div>
  );

  return (
    <>
      <Toast />
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/"             element={<HomePage />}  />
          <Route path="/lobby/:code"  element={<LobbyPage />} />
          <Route path="/game/:code"   element={<GamePage />}  />
          <Route path="/winner/:code" element={<WinnerPage />}/>
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </GameProvider>
  );
}
