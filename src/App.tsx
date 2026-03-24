import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SetupPage } from './pages/SetupPage';
import { SessionPage } from './pages/SessionPage';
import { ReviewPage } from './pages/ReviewPage';
import { StoryBankPage } from './pages/StoryBankPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/session/:sessionId" element={<SessionPage />} />
        <Route path="/review/:sessionId" element={<ReviewPage />} />
        <Route path="/storybank" element={<StoryBankPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
