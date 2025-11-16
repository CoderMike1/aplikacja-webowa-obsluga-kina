import './CinemasProgram.css'
import ShowTimeDateRange from "../MovieDetailsPage/ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {getMovies} from "../../../services/movieService.js";

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

            <div className="program__movies">
                {movies.map(movie=>(
                    <div className="movie__item" key={movie.id}>
                        <div className="movie__info">
                            <img src={movie.poster_path}/>
                            <h4>{movie.title}</h4>
                        </div>
                        <div className="movie__program">
                            <div className="program__item">
                                <p>15:00</p>
                                <p>Dubbing PL</p>
                                <p>Sala 5</p>
                            </div>
                            <div className="program__item">
                                <p>16:00</p>
                                <p>Napisy PL</p>
                                <p>Sala 11</p>
                            </div>
                            <div className="program__item">
                                <p>17:30</p>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                        </div>
                    </div>
                ))}


            </div>

        </div>

    )


}

export default CinemasProgram