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

        {/* 生徒用ホーム画面 */}
        <Route path="/home" element={<HomeScreen />} />

        {/* 先生専用ページ */}
        <Route path="/teacher" element={<TeacherScreenWrapper />} />

        <Route path="/detail/:id" element={<DetailScreen />} />
        <Route path="/assignments" element={<AssignmentsScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>
      <Toaster
        position="top-center"
        expand={true}
        richColors
        closeButton
        visibleToasts={9}
      />
    </BrowserRouter>
  );
}

export default App;