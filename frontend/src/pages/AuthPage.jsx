import AuthLayout from "../components/auth/AuthLayout"
import AuthCard from "../components/auth/AuthCard"
import ToastContainer from "../components/auth/ToastContainer"

export default function AuthPage() {
  return (
    <AuthLayout>
      <AuthCard />
      <ToastContainer />
    </AuthLayout>
  )
}