import './CinemasProgram.css'
import ShowTimeDateRange from "../MovieDetailsPage/ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {getMovies, getScreenings} from "../../../services/movieService.js";
import {Link} from "react-router-dom";

const CinemasProgram = () =>{
    const today = new Date()
    const [selectedDate,setSelectedDate] = useState(today.toISOString().slice(0, 10))

    const [movies,setMovies] = useState([])
    const [screenings,setScreenings] = useState([])
    const [loading,setLoading] = useState(false)

    const MOVIES_CACHE_KEY = "moviesCache";
    const SCREENINGS_CACHE_KEY = "screeningsCache"
    const CACHE_TTL_MS = 30 * 60 * 1000;
    useEffect(() => {
        const loadMovies = async () => {
            const cached = localStorage.getItem(MOVIES_CACHE_KEY);

            if (cached) {
                const parsed = JSON.parse(cached);
                const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

                if (!isExpired) {
                    setMovies(parsed.nowPlaying);
                    setLoading(false);
                    return;
                }
            }

            const resp = await getMovies();
            const data = resp.data;

            setMovies(data.nowPlaying);
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

        const loadScreenings = async () =>{

            const cached = localStorage.getItem(SCREENINGS_CACHE_KEY)

            if (cached){
                const parsed = JSON.parse(cached)

                const isExpired = new Date() - parsed.timestamp > CACHE_TTL_MS;
                if (!isExpired){
                    setScreenings(parsed.screenings);
                    setLoading(false);
                    return;
                }
            }

            const resp = await getScreenings();

            const data = resp.data

            setScreenings(data.results)
            setLoading(false)

            localStorage.setItem(SCREENINGS_CACHE_KEY,JSON.stringify({
                timestamp:Date.now(),
                screenings:data.results
            }))

        }
        loadScreenings()
    }, []);




    return (
        <div className="program__container">
            <div className="program__filter">
                <ShowTimeDateRange selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
            </div>
            {
                movies.length > 0 ?
                    <div className="program__movies">
                        {movies.map(movie=>(
                            <div className="movie__item" key={movie.id}>
                                <Link  to={`/filmy/${movie.id}`} className="movie__info">
                                    <img src={movie.poster_path}/>
                                    <h4>{movie.title}</h4>
                                </Link>
                                <div className="movie__program">
                                    {screenings
                                        .filter((screening) => screening.movie.id === movie.id)
                                        .map((screening) =>
                                            screening.projection_types.map((projection) => (
                                                <div
                                                    className="program__item"
                                                    key={`${screening.movie.id}-${projection.id}`}
                                                >
                                                    <span>{projection.time}</span>
                                                    <p>{projection.language}</p>
                                                    <p>Sala {projection.room}</p>
                                                </div>
                                            ))
                                        )}
                                </div>

                            </div>
                        ))}
                    </div>
                    :
                    <p className="main_page_loading">Ładowanie danych...</p>
            }


        </div>

    )


}

export default CinemasProgram

