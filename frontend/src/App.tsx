import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import History from './pages/History'
import Placeholder from './pages/Placeholder'
import Progress from './pages/Progress'
import Today from './pages/Today'
import Workout from './pages/Workout'
import WorkoutDetail from './pages/WorkoutDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="workout/:id" element={<Workout />} />
        <Route path="history" element={<History />} />
        <Route path="history/:id" element={<WorkoutDetail />} />
        <Route path="progress" element={<Progress />} />
        <Route path="body" element={<Placeholder titleKey="nav.body" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
