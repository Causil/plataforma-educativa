import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PracticeProvider } from './state/PracticeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Curso from './pages/Curso';
import Practica from './pages/Practica';
import Stub from './pages/Stub';

export default function App() {
  return (
    <PracticeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/curso" element={<Curso />} />
          <Route path="/practica" element={<Practica />} />
          <Route path="/docente" element={<Stub title="Panel docente" epic="E9" />} />
          <Route path="/admin" element={<Stub title="Administración" epic="E10" />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </PracticeProvider>
  );
}
