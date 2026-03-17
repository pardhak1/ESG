import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation();
  return (
    <nav class="flex px-4 border-b md:shadow-lg items-center relative">
        <div class="text-lg font-bold md:py-0 py-4">
            User Login System
        </div>
        <ul class="md:px-2 ml-auto md:flex md:space-x-2 absolute md:relative top-full left-0 right-0">
            {/* <NavLink to={"/"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Home</span>
                </a>
            </li>
            </NavLink>
            <NavLink to={"/team"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Team</span>
                </a>
            </li>
            </NavLink>
            <NavLink to={"/blog"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Blog</span>
                </a>
            </li>
            </NavLink>
            <NavLink to={"/about"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>About</span>
                </a>
            </li>
            </NavLink>
            <NavLink to={"/services"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Services</span>
                </a>
            </li>
            </NavLink>
            <NavLink to={"/contact"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Contact US</span>
                </a>
            </li>
            </NavLink> */}
{location.pathname !== "/dashboars" ?  
               ( <NavLink to={"/"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Login</span>
                </a>
            </li>
            </NavLink>)
            : 
            (
                <NavLink to={"/logout"}>
            <li>
                <a href="#" class="flex md:inline-flex p-4 items-center hover:bg-gray-50">
                    <span>Logout</span>
                </a>
            </li>
            </NavLink>
            )
            }

        </ul>
       
    </nav>
  )
}

export default Navbar