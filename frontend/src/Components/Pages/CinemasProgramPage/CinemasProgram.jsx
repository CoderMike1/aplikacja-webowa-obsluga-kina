import './CinemasProgram.css'
import ShowTimeDateRange from "../MovieDetailsPage/ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {getMovies, getScreenings} from "../../../services/movieService.js";
import {Link} from "react-router-dom";

const CinemasProgram = () =>{
    const today = new Date()
    const [selectedDate,setSelectedDate] = useState(today.toISOString().slice(0, 10))

    const [allScreenings,setAllScreenings] = useState([])
    const [screenings,setScreenings] = useState([])
    const [loading,setLoading] = useState(false)


    const SCREENINGS_CACHE_KEY = "screeningsCache"
    const CACHE_TTL_MS = 30 * 60 * 1000;
    useEffect(() => {

        const loadScreenings = async () =>{
            setLoading(true)
            const resp = await getScreenings();

            const data = resp.data

            const results = data.results;



            const items = []

            for (const result of results){
                const all_screenings = [];
                const projection_types = result.projection_types
                for (const projection_type of projection_types){
                    const screenings_for_projection_type = projection_type.screenings;
                    const projection_type_val = projection_type.projection_type;
                    for (const screening of screenings_for_projection_type){
                        const screening_info = {
                            projection_type:projection_type_val,
                            id:screening.id,
                            auditorium_name:screening.auditorium.id,
                            start_time:screening.start_time,
                            hour_start_time:new Date(screening.start_time).toLocaleTimeString("pl-PL", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                        }
                        all_screenings.push(screening_info)
                    }
                }
                const item = {
                    id:result.movie.id,
                    title:result.movie.title,
                    img:result.movie.poster_path,
                    screenings:all_screenings
                }
                items.push(item)
            }


            setAllScreenings(items);
            setLoading(false)

            localStorage.setItem(SCREENINGS_CACHE_KEY,JSON.stringify({
                timestamp:Date.now(),
                screenings:data.results
            }))

        }
        loadScreenings()
    }, []);

    const filterScreeningsByDate = () => {
        let filtered = allScreenings.map((movie) => ({
            ...movie,
            screenings: movie.screenings.filter(
                (s) => s.start_time.slice(0, 10) === selectedDate
            ),
        }));

        filtered = filtered.filter(f=> f.screenings.length > 0)

        setScreenings(filtered);
    };

    useEffect(()=>{

        filterScreeningsByDate()
    },[selectedDate,allScreenings])


    console.log(selectedDate)

    return (
        <div className="program__container">
            <div className="program__filter">
                <ShowTimeDateRange selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
            </div>
            {
                loading ?
                    <p className="main_page_loading">Ładowanie danych...</p>
                    :


                        screenings.length > 0 ?
                            <div className="program__movies">
                                {screenings.map(movie=>(
                                    <div className="movie__item" key={movie.id}>
                                        <Link  to={`/filmy/${movie.id}`} className="movie__info">
                                            <img src={movie.img}/>
                                            <h4>{movie.title}</h4>
                                        </Link>
                                        <div className="movie__program">
                                            {movie.screenings.map((s) => {
                                                return (
                                                    <div
                                                        className="program__item"
                                                        key={`${s.id}-${movie.id}`}
                                                    >
                                                        <span>{s.hour_start_time}</span>
                                                        <p>DUBBING {s.projection_type}</p>
                                                        <p>Sala {s.auditorium_name}</p>
                                                        <button>Kup Bilet</button>
                                                    </div>
                                                    )

                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            :
                            <p className="main_page_loading">Brak seansów w tym dniu...</p>

            }


        </div>

    )


}

export default CinemasProgram

