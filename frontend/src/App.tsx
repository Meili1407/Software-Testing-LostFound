import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { RequireRole } from "./components/RequireRole";

import HomePage from "./pages/home/HomePage";
import StudentHomePage from "./pages/student-home/StudentHomePage";
import ReportLostPage from "./pages/report-lost/ReportLostPage";
import FoundItemsPage from "./pages/found-items/FoundItemsPage";
import FoundItemDetailPage from "./pages/found-items/FoundItemDetailPage";
import MatchResultsPage from "./pages/matching/MatchResultsPage";
import SubmitClaimPage from "./pages/claim/SubmitClaimPage";
import TrackClaimPage from "./pages/claim/TrackClaimPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import ReportFoundPage from "./pages/staff/ReportFoundPage";
import ClaimReviewPage from "./pages/staff/ClaimReviewPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import AuditLogPage from "./pages/admin/AuditLogPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/student"
            element={
              <RequireRole roles={["STUDENT"]}>
                <StudentHomePage />
              </RequireRole>
            }
          />
          <Route path="/student/report-lost" element={<ReportLostPage />} />
          <Route path="/found-items" element={<FoundItemsPage />} />
          <Route path="/found-items/:id" element={<FoundItemDetailPage />} />
          <Route path="/matches/:reportId" element={<MatchResultsPage />} />
          <Route path="/claims/submit" element={<SubmitClaimPage />} />
          <Route path="/claims/track" element={<TrackClaimPage />} />
          <Route
            path="/staff"
            element={
              <RequireRole roles={["STAFF", "ADMIN"]}>
                <StaffDashboardPage />
              </RequireRole>
            }
          />
          <Route path="/staff/report-found" element={<ReportFoundPage />} />
          <Route
            path="/staff/claims/:id"
            element={
              <RequireRole roles={["STAFF", "ADMIN"]}>
                <ClaimReviewPage />
              </RequireRole>
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/admin/audit-log"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AuditLogPage />
              </RequireRole>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
