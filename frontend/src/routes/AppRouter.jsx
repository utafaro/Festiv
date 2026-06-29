import { BrowserRouter, Routes, Route } from "react-router"
import AuthPage from "../pages/AuthPage"
import Home from "../pages/Home"
import ProtectedRoute from "./ProtectedRoute"
import OAuthCallback from "../pages/OAuthCallback"



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={
          <OAuthCallback />
          
          } />
        <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
      </Routes>
    </BrowserRouter>
  )
}