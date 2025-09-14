import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './components/AuthPage'
import Body from './components/Body'
import TherapistProfile from './components/TherapistProfile'
import PatientProfile from './components/PatientProfile'

function App() {

  return (
    <>
      <BrowserRouter basename='/'>
        <Routes>
          <Route path='/' element={<Body />}>
            <Route index element={<Navigate to="/auth" replace />} />
            <Route path='/auth' element={<AuthPage />} />
            <Route path='/therapist/profile' element={<TherapistProfile />} />
            <Route path='/patient/profile' element={<PatientProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
