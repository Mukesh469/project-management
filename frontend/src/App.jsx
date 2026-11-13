import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthState from './context/auth/AuthState'
import EmployeeLogin from './components/common/login/employeeLogin'
import ManagerLogin from './components/common/login/ManagerLogin'
import AdminLogin from './components/common/login/AdminLogin'
import Employees from './components/pages/employees/Employees'
import Manager from './components/pages/manager/Manager'
import Admin from './components/pages/admin/Admin'
import PersonState from './context/person/PersonState'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

function App() {

  return (
    <>
      <AppProviders>
        <Router>
          <ToastContainer
            position='top-right'
            autoClose={4000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
            theme='dark'
          />
          <AppRoutes />
        </Router>
      </AppProviders>
    </>
  )
}

function AppProviders({ children }) {
  return (
    <AuthState>
      <PersonState>
        {children}
      </PersonState>
    </AuthState>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path='/login/'>
        <Route path='employee' element={<EmployeeLogin />} />
        <Route path='manager' element={<ManagerLogin />} />
        <Route path='admin' element={<AdminLogin />} />

      </Route>

      <Route path="/*" element={<Employees />} />
      <Route path="/manager/*" element={<Manager />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  )
}

export default App