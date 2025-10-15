import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallback } from './AuthCallback';
import { HomeScreen } from './components/HomeScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { DetailScreen } from './components/DetailScreen';
import { AssignmentsScreen } from './components/AssignmentsScreen';
import { TeacherScreen } from './components/TeacherScreen';

// Teacher Screen wrapper component
function TeacherScreenWrapper() {
  const navigate = useNavigate();
  return <TeacherScreen onBack={() => navigate('/')} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/detail/:id" element={<DetailScreen />} />
        <Route path="/assignments" element={<AssignmentsScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/teacher" element={<TeacherScreenWrapper />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;