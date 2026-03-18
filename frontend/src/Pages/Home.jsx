import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import Hero from '../components/Hero/Hero'
import TrendingNow from '../components/TrendingNow/TrendingNow'
import TopRated from '../components/TopRated/TopRated'
import Footer from '../components/Footer/Footer'
import './CSS/Home.css'

function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <TrendingNow />
      <TopRated />
      <Footer />
    </div>
  )
}

export default Home
