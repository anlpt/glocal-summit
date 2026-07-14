import { Routes, Route } from 'react-router-dom';
import Header from './components/shell/Header.tsx';
import Participant from './pages/participant/Participant.tsx';
import Live from './pages/live/Live.tsx';
import Admin from './pages/admin/Admin.tsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Participant />} />
          <Route path="/live" element={<Live />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}
