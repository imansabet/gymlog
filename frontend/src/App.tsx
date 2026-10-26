import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Placeholder from './pages/Placeholder'
import Today from './pages/Today'
import Workout from './pages/Workout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="history" element={<Placeholder titleKey="nav.history" />} />
        <Route path="progress" element={<Placeholder titleKey="nav.progress" />} />
        <Route path="body" element={<Placeholder titleKey="nav.body" />} />
	<Route path="workout/:id" element={<Workout />} />
      </Route>
    </Routes>
  )
}
