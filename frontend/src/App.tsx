import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './components/AuthPage'
import Body from './components/Body'

function App() {

  return (
    <>
      <BrowserRouter basename='/'>
        <Routes>
          <Route path='/' element={<Body />}>
            <Route index element={<Navigate to="/auth" replace />} />
            <Route path='/auth' element={<AuthPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
