import React, { useEffect, lazy, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { useTasksContext } from "./components/hooks/useTasksContext";
import { useAuthContext } from "./components/hooks/useAuthContext";
import Loader from "./components/common/Loader";
import ProfileUploadModal from "./components/common/Modal";
import { useImageUpload } from "./components/hooks/useImageUpload";
import { Analytics } from "@vercel/analytics/react";
import { toast } from "react-toastify";

// Lazy-loaded components
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const ProductivityPage = lazy(() => import("./pages/ProductivityPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BroadcastPage = lazy(() => import("./pages/BroadcastPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const SignIn = lazy(() => import("./components/auth/SignIn"));
const CreatePassword = lazy(() => import("./components/auth/CreatePassword"));

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const { dispatch } = useTasksContext();
  const { uploadImage } = useImageUpload();
  const { user } = useAuthContext();

  const authPaths = ["/login", "/create_password"];

  // Fetch tasks when user logs in
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`${API_URL}/api/task`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        if (!response.ok) {
          toast(`${response.statusText}`, {
            position: "top-center",
            autoClose: 5000, // Closes after 3 seconds
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          const timeOut = setTimeout(() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }, 7000);

          return () => clearTimeout(timeOut);
        }

        const data = await response.json();
        dispatch({ type: "SET_TASK", payload: data.data });
        // console.log("here", data.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    if (user) {
      fetchTask();
    }
  }, [dispatch, user]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = async (file) => {
    // console.log("File uploaded:", file);
    // Add logic to send the file to the backend here
    await uploadImage(file);
  };

  return (
    <BrowserRouter>
      {user && !authPaths.includes(location.pathname) && (
        <ProfileUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpload={handleUpload}
        />
      )}
      <Routes>
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route
            path="/overview"
            element={user ? <OverviewPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/tasks"
            element={user ? <TasksPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/reports"
            element={user ? <ReportsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/productivity"
            element={user ? <ProductivityPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/sales"
            element={user ? <SalesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/broadcast"
            element={user ? <BroadcastPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/employees"
            element={user ? <EmployeesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={user ? <SettingsPage /> : <Navigate to="/login" />}
          />
        </Route>

        {/* Authentication Routes */}
        <Route
          path="/login"
          element={!user ? <SignIn /> : <Navigate to="/overview" />}
        />
        <Route path="/create_password" element={<CreatePassword />} />

        {/* Catch-All Route */}
        <Route
          path="*"
          element={<Navigate to={user ? "/overview" : "/login"} />}
        />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
