import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './components/AuthPage'
import Body from './components/Body'
import TherapistProfile from './components/TherapistProfile'
import PatientProfile from './components/PatientProfile'
import { Provider } from 'react-redux'
import store from './utils/store'

function App() {

  return (
    <>
      <Provider store={store}>
        <BrowserRouter basename='/'>
          <Routes>
            <Route path='/' element={<Body />}>
              <Route index element={<Navigate to="/auth" replace />} />
              <Route path='/auth' element={<AuthPage />} />
              <Route path='/therapist/dashboard' element={<TherapistProfile />} />
              <Route path='/patient/dashboard' element={<PatientProfile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  )
}

export default App
