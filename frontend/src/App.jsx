import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Series from './Pages/Series'
import SeriesDetail from './Pages/SeriesDetail'
import Profile from './Pages/Profile'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series-detail/:id" element={<SeriesDetail />} />
          <Route path="/series-detail" element={<SeriesDetail />} />
          <Route path="/seriesdetail" element={<SeriesDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

