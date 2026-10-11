import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/lib/theme';
import EditorPage from '@/pages/editor/EditorPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/editor/:fileId" element={<EditorPage />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
