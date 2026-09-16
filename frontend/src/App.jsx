import { RouterProvider } from "react-router-dom";
import { Router } from "./router";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={Router} />
    </AuthProvider>
  );
}
