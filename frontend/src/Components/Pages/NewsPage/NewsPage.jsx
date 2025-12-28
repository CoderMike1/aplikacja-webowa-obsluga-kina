import './NewsPage.css'
import {useEffect, useState} from "react";
import {getMovies} from "../../../services/movieService.js";
import {Link} from "react-router-dom";
import Spinner from "../../../utils/Spinner/Spinner.jsx";

const NewsPage = () =>{
    const [loading,setLoading] = useState(true)
    const [latestMovies,setLatestMovies] = useState([])
    const [upcomingMovies,setUpcomingMovies] = useState([])

    const CACHE_KEY = "moviesCache";
    // const CACHE_TTL_MS = 30 * 60 * 1000;
    const CACHE_TTL_MS = 100;
    useEffect(() => {
        const loadMovies = async () => {
            const cached = localStorage.getItem(CACHE_KEY);

            if (cached) {
                const parsed = JSON.parse(cached);
                const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

                if (!isExpired) {
                    setLatestMovies(parsed.nowPlaying);
                    setUpcomingMovies(parsed.upcoming);
                    return;
                }
            }

            const resp = await getMovies();
            const data = resp.data;
            let twoWeeksAgo = new Date()
            twoWeeksAgo.setDate(twoWeeksAgo.getDate()-1*15)
            twoWeeksAgo = twoWeeksAgo.toISOString().slice(0,10)
            const latest_movies = data.now_playing.filter(movie=>{
                return movie.release_date < twoWeeksAgo;
            })



            setLatestMovies(latest_movies);
            setUpcomingMovies(data.upcoming);
            setLoading(false);

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    nowPlaying: data.now_playing,
                    upcoming: data.upcoming,
                })
            );
        };

        loadMovies();
    }, []);

    console.log(loading)
    return (
        <div className="news__container">
            {
                !loading ?
                    <div className="news__container__inner">
                        {
                            latestMovies.map((m)=>(
                                <div className="news__item_playing" key={m.id}>
                                    <div className="news__item_info">
                                        <h3>JUŻ TO GRAMY!</h3>
                                    </div>
                                    <img src={m.poster_path}/>
                                    <span>{m.title}</span>
                                    <Link  to={`/filmy/${m.id}`} className="news__item_link">
                                        <h4>Kup Bilet!</h4>
                                    </Link>

                                </div>
                            ))
                        }
                        {
                            upcomingMovies.map((m)=>(
                                <div className="news__item_playing" key={m.id}>
                                    <div className="news__item_upcoming_info">
                                        <h3>Wkrótce!</h3>
                                        <p>Premiera: {m.release_date}</p>
                                    </div>
                                    <img src={m.poster_path}/>
                                    <span>{m.title}</span>
                                </div>
                            ))
                        }

                    </div>
                    :
                   <Spinner/>
            }



        </div>

    )
}

export default NewsPage

