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
    const [loading,setLoading] = useState(true)

    const CACHE_KEY = "moviesCache";
    const CACHE_TTL_MS = 30 * 60 * 1000;
    useEffect(() => {
        const loadMovies = async () => {
            const cached = localStorage.getItem(CACHE_KEY);

            if (cached) {
                const parsed = JSON.parse(cached);
                const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

                if (!isExpired) {
                    setNowPlayingMovies(parsed.nowPlaying);
                    setSoonPlayingMovies(parsed.upcoming);
                    setSpecialEvents(parsed.special);
                    setLoading(false);
                    return;
                }
            }

            const resp = await getMovies();
            const data = resp.data;

            setNowPlayingMovies(data.now_playing);
            setSoonPlayingMovies(data.upcoming);
            setSpecialEvents(data.special_event);
            setLoading(false);

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    nowPlaying: data.now_playing,
                    upcoming: data.upcoming,
                    special: data.special_event,
                })
            );
        };

        loadMovies();
    }, []);


    return (
        <div className="main_page">
            <NewsSlides />
            {loading ?
            <p className="main_page_loading">Ładowanie danych...</p>
                :
                <MoviePanels soonPlayingMovies={soonPlayingMovies} nowPlayingMovies={nowPlayingMovies} specialEvents={specialEvents}/>
            }

        </div>
    )
}

export default MainPage