import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'



//inicjalizacja elementu odpowiedzialnego za routing
import  {createBrowserRouter, RouterProvider} from "react-router-dom"
import MainPage from "./Components/Pages/MainPage/MainPage.jsx";
import MoviesPage from "./Components/Pages/MoviesPage/MoviesPage.jsx";
import NewsPage from "./Components/Pages/NewsPage/NewsPage.jsx";
import PromosPage from "./Components/Pages/PromosPage/PromosPage.jsx";
import MovieDetailsPage from "./Components/Pages/MovieDetailsPage/MovieDetailsPage.jsx";
const router = createBrowserRouter([
    {
        path:'/',
        element:<App/>,
        children:[
            {path:'/', element:<MainPage/>},
            {path:'/repertuar', element:<MoviesPage/>},
            {path:'/nowosci',element:<NewsPage/>},
            {path:'/promocje', element:<PromosPage/>},
            {path:'/filmy/:movieID', element:<MovieDetailsPage/>}
        ]
    }
])



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
