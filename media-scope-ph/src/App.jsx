import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Navbar from './Navbar.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="bg-gray-100">
      <Navbar />
      <h1 className='text-3xl font-bold underline'>Hello World</h1>

      <svg className="w-6 h-6">
        <use href="/icons.svg#github-icon" />
      </svg>
    </div>
  )
}

export default App
