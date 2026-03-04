import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../Layout'
import Home from '../Pages/Home'
import Services from '../Pages/Services'
import Team from '../Pages/Team'
import BookAppointment from '../Pages/BookAppointment'
import AdminLogin from '../Pages/AdminLogin'
import AdminAppointments from '../Pages/AdminAppointments'
import AdminBlockedPeriods from '../Pages/AdminBlockedPeriods'
import ScrollToTop from './components/ScrollToTop'
import { ROUTES } from '@/config/siteConfig'

function withLayout(Component, currentPageName) {
  return (
    <Layout currentPageName={currentPageName}>
      <Component />
    </Layout>
  )
}

export default function App() {
  const routeComponents = {
    Home,
    Services,
    Team,
    BookAppointment,
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {ROUTES.map((route) => {
          const Component = routeComponents[route.id]
          if (!Component) return null

          return (
            <Route
              key={route.path}
              path={route.path}
              element={withLayout(Component, route.id)}
            />
          )
        })}
        <Route
          path="/admin"
          element={withLayout(AdminLogin, 'Admin')}
        />
        <Route
          path="/admin/appointments"
          element={withLayout(AdminAppointments, 'Admin')}
        />
        <Route
          path="/admin/blocked-periods"
          element={withLayout(AdminBlockedPeriods, 'Admin')}
        />
        <Route path="*" element={withLayout(Home, 'Home')} />
      </Routes>
    </>
  )
}
