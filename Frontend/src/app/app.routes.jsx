import { createBrowserRouter } from "react-router";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import ResetPassword from "../features/auth/pages/ResetPassword";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected from "../features/auth/components/Protected";
import { Navigate } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/",
    element: 
      <Protected>
        <Dashboard />
      </Protected>
    ,
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace/>
  }
]);
