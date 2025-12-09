import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'



//inicjalizacja elementu odpowiedzialnego za routing
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MainPage from "./Components/Pages/MainPage/MainPage.jsx";
import CinemasProgram from "./Components/Pages/CinemasProgramPage/CinemasProgram.jsx";
import NewsPage from "./Components/Pages/NewsPage/NewsPage.jsx";
import PromosPage from "./Components/Pages/PromosPage/PromosPage.jsx";
import MovieDetailsPage from "./Components/Pages/MovieDetailsPage/MovieDetailsPage.jsx";
import SelectSeats from "./Components/Pages/CheckoutPages/SelectSeats/SelectSeats.jsx";
import Checkout from "./Components/Pages/CheckoutPages/Checkout.jsx";
import Success from "./Components/Pages/CheckoutPages/Success/Success.jsx";
import ProfilePage from "./Components/Pages/ProfilePages/ProfilePage.jsx";
import { ProfileProvider } from './context/ProfileContext.jsx';
import AdminPage from "./Components/Pages/AdminPages/AdminPage.jsx";
import ScreeningsPage from "./Components/Pages/AdminPages/ScreeningsPage/ScreeningsPage.jsx";
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <MainPage /> },
      { path: '/repertuar', element: <CinemasProgram /> },
      { path: '/nowosci', element: <NewsPage /> },
      { path: '/promocje', element: <PromosPage /> },
      { path: '/filmy/:movieID', element: <MovieDetailsPage /> },
      { path: "/checkout", element: <Checkout /> },
      { path: '/success', element: <Success /> },
      { path: '/profil', element: <ProfileProvider><ProfilePage /></ProfileProvider> },
      { path: '/panel-pracownika', element: <AdminPage /> },
      { path: '/panel-pracownika/seanse', element: <ScreeningsPage /> }
    ]
  }
])



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
