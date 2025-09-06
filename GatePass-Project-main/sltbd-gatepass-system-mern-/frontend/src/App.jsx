import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AzureCallback from "./components/AzureCallback.jsx";
import Home from "./pages/Home.jsx";
import ExecutiveApproval from "./pages/ExecutiveApproval.jsx";
import AdminDashboard from "./pages/Admin.jsx";
import GatePassRequests from "./pages/MyRequests.jsx";
import GatePassItemTracker from "./pages/ItemTracker.jsx";
import NewRequest from "./pages/NewRequest.jsx";
import Dispatch from "./pages/Dispatch.jsx";
import Receive from "./pages/Receive.jsx";
import GatePassMyReicept from "./pages/MyReceipts.jsx";
import Verify from "./pages/Verify.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import EmailForm from "./pages/Example.jsx";

const App = () => {
  return (
    <div className="pt-20">
      <ToastProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/callback" element={<AzureCallback />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "Admin",
                  "SuperAdmin",
                  "User",
                  "Approver",
                  "Verifier",
                  "Pleader",
                  "Dispatcher",
                ]}
              />
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/newrequest" element={<NewRequest />} />
            <Route path="/myrequests" element={<GatePassRequests />} />
            <Route path="/itemTracker" element={<GatePassItemTracker />} />
            <Route path="/myReceipts" element={<GatePassMyReicept />} />
            <Route path="/emailForm" element={<EmailForm />} />
          </Route>

          {/* Role-Specific Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]} />}
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "SuperAdmin", "Approver"]}
              />
            }
          >
            <Route path="/executiveApproval" element={<ExecutiveApproval />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "SuperAdmin", "Verifier"]}
              />
            }
          >
            <Route path="/verify" element={<Verify />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "SuperAdmin", "Pleader"]}
              />
            }
          >
            <Route path="/dispatch" element={<Dispatch />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "SuperAdmin", "Dispatcher"]}
              />
            }
          >
            <Route path="/receive" element={<Receive />} />
          </Route>
        </Routes>
      </ToastProvider>
    </div>
  );
};

export default App;
