import { Route, Routes } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { Footer } from "./components/Footer"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { SettingsPage } from "./pages/SettingsPage"
import { ProfilePage } from "./pages/ProfilePage"
import { ClassesPage } from "./pages/ClassesPage" 
import { CreateClassPage } from "./pages/CreateClassPage"
import { EnrollClassPage } from "./pages/EnrollClassPage"
import { ClassDetailsPage } from "./pages/ClassDetailsPage"
import { ClassMarksPage } from "./pages/ClassMarksPage"
import { CreateQuizPage } from "./pages/CreateQuizPage"
import { QuizPage } from "./pages/QuizPage"
import { authStore } from "./store/useAuthStore"
import { useEffect } from "react"

const App = () => {
  const { checkAuth } = authStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          } />
          <Route path="/create-class" element={
            <ProtectedRoute>
              <CreateClassPage />
            </ProtectedRoute>
          } />
          <Route path="/enroll-class" element={
            <ProtectedRoute>
              <EnrollClassPage />
            </ProtectedRoute>
          } />
          <Route path="/classes/:classId" element={
            <ProtectedRoute>
              <ClassDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/classes/:classId/marks" element={
            <ProtectedRoute>
              <ClassMarksPage />
            </ProtectedRoute>
          } />
          <Route path="/classes/:classId/create-quiz" element={
            <ProtectedRoute>
              <CreateQuizPage />
            </ProtectedRoute>
          } />
          <Route path="/quizzes/:quizId" element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App