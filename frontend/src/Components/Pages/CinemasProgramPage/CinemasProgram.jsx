import './CinemasProgram.css'
import ShowTimeDateRange from "../MovieDetailsPage/ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {getMovies} from "../../../services/movieService.js";
import {Link} from "react-router-dom";

const CinemasProgram = () =>{
    const today = new Date()
    const [selectedDate,setSelectedDate] = useState(today.toISOString().slice(0, 10))

    const [movies,setMovies] = useState([])

    useEffect(() => {

        (async () =>{

            const resp = await getMovies();

            const data = resp.data
            setMovies(data.now_playing)
        })()

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

                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>
                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>

                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>
                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>
                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>
                                    <div className="program__item">
                                        <span>17:30</span>
                                        <p>Dubbing PL</p>
                                        <p>Sala 8</p>
                                    </div>

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

