import React, { useState } from 'react'
import { Link } from 'react-router-dom'
// import SignIn from './login'

const Logout = () => { 
  const [changePath] = useState(localStorage)
  return (
    <div>
  
          {changePath.removeItem('data')} 
          <h1>Page Logout</h1>
          
          {/* <SignIn/> */}

    </div>
  )
}

export default Logout
