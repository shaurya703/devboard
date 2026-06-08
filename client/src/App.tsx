import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useInitAuth } from "./features/auth/useAuth";
import { Toaster } from "./components/ui/Toaster";

export default function App() {
  // Attempt silent login from the refresh cookie on first load.
  useInitAuth();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
