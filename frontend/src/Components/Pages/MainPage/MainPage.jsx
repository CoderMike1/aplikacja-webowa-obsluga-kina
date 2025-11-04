//glowna strona
import NewsSlides from "./NewsSlides/NewsSlides.jsx";
import MoviePanels from "./MoviePanels/MoviePanels.jsx";
import './MainPage.css'
import {useEffect, useState} from "react";
import {getMovies} from "../../../services/movieService.js";
const MainPage = () =>{

    const [nowPlayingMovies,setNowPlayingMovies] = useState([])
    const [soonPlayingMovies,setSoonPlayingMovies] = useState([])
    const [specialEvents,setSpecialEvents] = useState([])

    useEffect(() => {

        (async () =>{

            const resp = await getMovies();

            const data = resp.data
            setNowPlayingMovies(data.grane_teraz)
            setSoonPlayingMovies(data.wkrótce)
            setSpecialEvents(data.wydarzenia_specjalne)
        })()

    }, []);


    return (
        <div className="main_page">
            <NewsSlides />
            <MoviePanels soonPlayingMovies={soonPlayingMovies} nowPlayingMovies={nowPlayingMovies} specialEvents={specialEvents}/>
        </div>
    )
}

export default MainPage