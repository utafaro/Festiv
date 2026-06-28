import { BrowserRouter, Routes, Route } from "react-router"
import AuthPage from "../pages/AuthPage"



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage/>} />
      </Routes>
    </BrowserRouter>
  )
}