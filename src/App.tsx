import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'

function App() {

  return (
    <Router>
      <div data-bs-theme="dark" className="min-vh-100 text-bg-dark">
        <AppRoutes />|
      </div>
    </Router>
  )
}

export default App
