// types/ App.tsx
import React, { useState } from 'react';
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


function App() {
  // 💡 修正点 1: useState を使用して、ユーザーのロールを管理します。
  // 現在は先生画面を確認するため、ロールを 'teacher' に強制固定します。
  const [userRole] = useState<'teacher' | 'student'>('teacher'); 
  const isTeacher = userRole === 'teacher';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* 💡 修正点 2: /home ルートでログインユーザーのロールに基づき、表示コンポーネントを切り替え */}
        <Route 
          path="/home" 
          element={isTeacher ? <TeacherScreen /> : <HomeScreen />} 
        />
        
        {/* /teacher ルートは /home ルートで吸収されたため削除します。 */}
        {/* 必要に応じて、TeacherScreenWrapperコンポーネントとルートを復活させてください。 */}
        
        <Route path="/detail/:id" element={<DetailScreen />} />
        <Route path="/assignments" element={<AssignmentsScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;