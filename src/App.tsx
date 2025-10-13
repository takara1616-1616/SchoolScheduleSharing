import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallback } from './AuthCallback';
import { HomeScreen } from './components/HomeScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { NotificationScreen } from './components/NotificationScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { DetailScreen } from './components/DetailScreen';
import { AssignmentsScreen } from './components/AssignmentsScreen';

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
        <Route path="/notifications" element={<NotificationScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;