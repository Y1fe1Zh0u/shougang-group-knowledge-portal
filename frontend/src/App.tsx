import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import QAPage from './pages/QAPage';
import AppsPage from './pages/AppsPage';
import AdminPage from './pages/AdminPage';
import DomainsPage from './pages/DomainsPage';

function RouteScrollReset() {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const scrollingElement = document.scrollingElement;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
    root.scrollTop = 0;
    body.scrollTop = 0;
    if (scrollingElement) scrollingElement.scrollTop = 0;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      root.style.scrollBehavior = previousRootScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <RouteScrollReset />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/domain/:domainName" element={<ListPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/space/:spaceId" element={<ListPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/space/:spaceId/file/:fileId" element={<DetailPage />} />
        <Route path="/qa" element={<QAPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}
