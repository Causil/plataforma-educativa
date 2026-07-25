import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PracticeProvider } from './state/PracticeContext';
import { AuthProvider } from './state/AuthContext';
import { RequireRole } from './components/RequireRole';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Curso from './pages/Curso';
import Diagnostico from './pages/Diagnostico';
import Practica from './pages/Practica';
import Evaluacion from './pages/Evaluacion';
import Docente from './pages/Docente';
import Stub from './pages/Stub';

export default function App() {
  return (
    <AuthProvider>
      <PracticeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/curso"
              element={<RequireRole allow={['est', 'prof', 'adm']}><Curso /></RequireRole>}
            />
            <Route
              path="/diagnostico"
              element={<RequireRole allow={['est', 'prof', 'adm']}><Diagnostico /></RequireRole>}
            />
            <Route
              path="/practica"
              element={<RequireRole allow={['est', 'prof', 'adm']}><Practica /></RequireRole>}
            />
            <Route
              path="/evaluacion"
              element={<RequireRole allow={['est', 'prof', 'adm']}><Evaluacion /></RequireRole>}
            />
            <Route
              path="/docente"
              element={<RequireRole allow={['prof', 'adm']}><Docente /></RequireRole>}
            />
            <Route
              path="/admin"
              element={<RequireRole allow={['adm']}><Stub title="Administración" epic="E10" /></RequireRole>}
            />
            <Route path="*" element={<Landing />} />
          </Routes>
        </BrowserRouter>
      </PracticeProvider>
    </AuthProvider>
  );
}
