import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './hooks/useGameState';
import { useSocket } from './hooks/useSocket';
import Toast from './components/ui/Toast';
import HomePage   from './pages/HomePage';
import LobbyPage  from './pages/LobbyPage';
import GamePage   from './pages/GamePage';
import WinnerPage from './pages/WinnerPage';

// AppRouter lives inside BrowserRouter so useNavigate works inside useSocket.
// useSocket is called here — once, at the root — so no socket events are ever
// missed regardless of which page is currently rendered.
function AppRouter() {
  useSocket();
  return (
    <>
      <Toast />
      <Routes>
        <Route path="/"             element={<HomePage />}  />
        <Route path="/lobby/:code"  element={<LobbyPage />} />
        <Route path="/game/:code"   element={<GamePage />}  />
        <Route path="/winner/:code" element={<WinnerPage />}/>
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
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
