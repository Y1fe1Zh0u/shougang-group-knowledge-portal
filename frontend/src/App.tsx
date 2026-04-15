import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import QAPage from './pages/QAPage';
import AppsPage from './pages/AppsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/space/:spaceId" element={<ListPage />} />
      <Route path="/list" element={<ListPage />} />
      <Route path="/space/:spaceId/file/:fileId" element={<DetailPage />} />
      <Route path="/qa" element={<QAPage />} />
      <Route path="/apps" element={<AppsPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
