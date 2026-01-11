import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { GamePage } from './pages/GamePage'; // Placeholder
// import { ResultPage } from './pages/ResultPage';

function App() {
  return (
    <Router>
      <div className="text-center min-h-screen text-white">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<GamePage />} />
          {/* <Route path="/result" element={<ResultPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
