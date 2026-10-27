import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Placeholder from './pages/Placeholder'
import Today from './pages/Today'
import History from './pages/History'
import Progress from './pages/Progress'
import WorkoutDetail from './pages/WorkoutDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="history" element={<Placeholder titleKey="nav.history" />} />
        <Route path="progress" element={<Placeholder titleKey="nav.progress" />} />
        <Route path="body" element={<Placeholder titleKey="nav.body" />} />
     	<Route path="history" element={<History />} />
	<Route path="history/:id" element={<WorkoutDetail />} />
	<Route path="progress" element={<Progress />} />
       	</Route>
    </Routes>
  )
}
