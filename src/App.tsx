
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Index from '@/pages/Index'
import Feed from '@/pages/Feed'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import PostView from './pages/PostView'
import Followers from './pages/Followers'
import Messages from "@/pages/Messages";
import MessagesList from "@/pages/MessagesList";
import Notifications from "@/pages/Notifications";
import AdminPanel from "@/pages/AdminPanel";
import AdminViewMessages from "@/pages/AdminViewMessages";
import NotFound from './pages/NotFound'
import AuthGuard from '@/components/AuthGuard'
import './App.css'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/feed" element={
          <AuthGuard>
            <Feed />
          </AuthGuard>
        } />
        <Route path="/post/:postId" element={
          <AuthGuard>
            <PostView />
          </AuthGuard>
        } />
        <Route path="/profile" element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        } />
        <Route path="/user/:username" element={
          <AuthGuard>
            <UserProfile />
          </AuthGuard>
        } />
        <Route path="/followers/:username/:tab" element={
          <AuthGuard>
            <Followers />
          </AuthGuard>
        } />
        <Route path="/messages" element={
          <AuthGuard>
            <MessagesList />
          </AuthGuard>
        } />
        <Route path="/messages/:username" element={
          <AuthGuard>
            <Messages />
          </AuthGuard>
        } />
        <Route path="/notifications" element={
          <AuthGuard>
            <Notifications />
          </AuthGuard>
        } />
        <Route path="/admin" element={
          <AuthGuard>
            <AdminPanel />
          </AuthGuard>
        } />
        <Route path="/admin/messages/:username" element={
          <AuthGuard>
            <AdminViewMessages />
          </AuthGuard>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
