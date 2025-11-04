import './MovieDetailsPage.css'
import ShowTimeDateRange from "./ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useState} from "react";

const MovieDetailsPage = () =>{

    const [selectedDate,setSelectedDate] = useState(null)

    const poster_url = "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg";
    const title = "Strażnicy Galaktyki"
    const original_title = "Guardians of the Galaxy"
    const release_date = "2014-08-01"
    const description = "Złodziej Peter Quill łączy siły z grupą dziwaków, by chronić potężny artefakt przed Ronanem i zapobiec zniszczeniu galaktyki."
    const directors = "James Gunn"
    const duration_time = "122"


    return (
        <div className="movie_details__container">

            <div className="movie_details__inner">
                <div className="movie_details__left">
                    <div className="movie_inner__image">
                        <img src={poster_url} alt={title}/>
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
                            <p>{original_title}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Opis</h5>
                            <p>{description}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Czas trwania</h5>
                            <p>{duration_time} minuty</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Data premiery</h5>
                            <p>{release_date}</p>
                        </div>
                        <div className="movie_info__item">
                            <h5>Reżyseria</h5>
                            <p>{directors}</p>
                        </div>
                    </div>

                    <div className="movie_details__showtimes">
                        <ShowTimeDateRange selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>


                    </div>

                </div>

            </div>

        </div>



    )

}

export default MovieDetailsPage