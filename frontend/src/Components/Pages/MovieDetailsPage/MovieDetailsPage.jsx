import './MovieDetailsPage.css'
import ShowTimeDateRange from "./ShowTimeDateRange/ShowTimeDateRange.jsx";
import {useEffect, useState} from "react";
import {api} from "../../../api/client.js";
import {useNavigate, useParams} from "react-router-dom";
import {getScreenings} from "../../../services/movieService.js";
import {useCheckout} from "../../../context/CheckoutContext.jsx";

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
    const [allScreenings,setAllScreenings] = useState([])
    const [currentScreenings,setCurrentScreenings] = useState([])

    const navigate = useNavigate()
    const {startCheckout} = useCheckout()

    useEffect(() => {

        (async ()=>{
            setLoading(true)
           const resp = await api.get(`/movies/${movieID}`)

            const data = resp.data
            setPosterURL(data.poster_path);
           setTitle(data.title);
           setOriginalTitle(data.original_title);
           setReleaseDate(data.release_date);
           setDescription(data.description);
           setDirectors(data.directors);
           setDurationTime(data.duration_minutes)

            const resp2 = await getScreenings();

            const data2 = resp2.data

            const results = data2.results;

            for (const result of results){
                if (result.movie.id === Number(movieID)){
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
                            console.log(screening_info)
                            all_screenings.push(screening_info)
                        }
                    }
                    setAllScreenings(all_screenings)
                    break
                }

            }
            setLoading(false)
        })()

    }, []);


    const filterScreeningsByDate = () => {

        let filtered = allScreenings.filter((screening) =>{
            return screening.start_time.slice(0, 10) === selectedDate
        })

        setCurrentScreenings(filtered);
    };

    useEffect(()=>{
        filterScreeningsByDate()
    },[selectedDate,allScreenings])

    const handleBuyTicketButton = (movie_title,movie_image,movie_directors,showtime_hour,showtime_full_date,projection_type,auditorium) =>{
        startCheckout({movie_title,movie_image,movie_directors,showtime_hour,showtime_full_date,projection_type,auditorium})
        navigate("/checkout")
    }


    return (
        <div className="movie_details__container">
            {loading ?
                <p className="main_page_loading">Ładowanie danych...</p>
                :
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
                                {currentScreenings.map((s)=>(
                                    <div className="movie_showtime_item" key={s.id}>
                                        <span>{s.hour_start_time}</span>
                                        <p>DUBBING {s.projection_type}</p>
                                        <p>Sala {s.auditorium_name}</p>
                                        <button onClick={()=>handleBuyTicketButton(title,posterURL,directors,s.id,s.hour_start_time,s.start_time,s.projection_type,s.auditorium_name)}>Kup Bilet</button>
                                    </div>
                                ))}
                                <div>
                                    {
                                        currentScreenings.length === 0 && <p>Brak seansów w tym dniu...</p>
                                    }
                                </div>
                            </div>



                        </div>

                    </div>

                </div>
            }


        </div>



    )

}

export default MovieDetailsPage

