import './MovieDetailsPage.css'
import ShowTimeDateRange from "./ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {api} from "../../../api/client.js";
import {useParams} from "react-router-dom";

const MovieDetailsPage = () =>{

    const {movieID} = useParams()
    const today = new Date()
    const [selectedDate,setSelectedDate] = useState(today.toISOString().slice(0, 10))

    const [posterURL,setPosterURL] = useState("");
    const [title,setTitle] = useState("");
    const [originalTitle,setOriginalTitle] = useState("");
    const [releaseDate,setReleaseDate] = useState("");
    const [description,setDescription] = useState("");
    const [directors,setDirectors] = useState("");
    const [durationTime,setDurationTime] = useState("")

    const [loading,setLoading] = useState(true)

    useEffect(() => {

        (async ()=>{
           const resp = await api.get(`/movies/${movieID}`)

            const data = resp.data
            setPosterURL(data.poster_path);
           setTitle(data.title);
           setOriginalTitle(data.original_title);
           setReleaseDate(data.release_date);
           setDescription(data.description);
           setDirectors(data.directors);
           setDurationTime(data.duration_minutes)
            setLoading(false)
        })()

    }, []);

    return (
        <div className="movie_details__container">

            <div className="movie_details__inner">
                <div className="movie_details__left">
                    <div className="movie_inner__image">
                        <img src={posterURL} alt={title}/>
                    </div>
                </div>
                <div className="movie_details__right">
                    <div className="movie_details__info">
                        <div className="movie_info__item">
                            <h5>Tytuł</h5>
                            <h3>{title}</h3>
                        </div>
                        <div className="movie_info__item">
                            <h5>Oryginalny tytuł</h5>
                            <p>{originalTitle}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Opis</h5>
                            <p>{description}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Czas trwania</h5>
                            <p>{durationTime} minuty</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Data premiery</h5>
                            <p>{releaseDate}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Reżyseria</h5>
                            <p>{directors}</p>
                        </div>
                    </div>

                    <div className="movie_details__showtimes">
                        <div className="movie_details__showtimes_panel">
                            <ShowTimeDateRange selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
                        </div>

                        <div className="movie_showtimes_table">
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>

                            <div className="movie_showtime_item">
                                <span>17:30</span>
                                <p>Dubbing PL</p>
                                <p>Sala 8</p>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </div>



    )

}

export default MovieDetailsPage

