import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage, RegisterPage } from "@/features/auth/AuthPages";
import { BoardListPage } from "@/features/boards/BoardListPage";
import { BoardPage } from "@/features/boards/BoardPage";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/boards", element: <BoardListPage /> },
          { path: "/boards/:boardId", element: <BoardPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/boards" replace /> },
  { path: "*", element: <Navigate to="/boards" replace /> },
]);
