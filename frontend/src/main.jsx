import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'



//inicjalizacja elementu odpowiedzialnego za routing
import  {createBrowserRouter, RouterProvider} from "react-router-dom"
import MainPage from "./Components/MainPage/MainPage.jsx";
const router = createBrowserRouter([
    {
        path:'/',
        element:<App/>,
        children:[
            {path:'/', element:<MainPage/>}
        ]
    }
])



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
