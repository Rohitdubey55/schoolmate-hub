import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import FeesPage from "./pages/FeesPage";
import ExpensesPage from "./pages/ExpensesPage";
import StaffPage from "./pages/StaffPage";
import VanStudentsPage from "./pages/VanStudentsPage";
import SettingsPage from "./pages/SettingsPage";
import BulkReminderPage from "./pages/BulkReminderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:rollNo" element={<StudentProfilePage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/van" element={<VanStudentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/bulk-reminder" element={<BulkReminderPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
