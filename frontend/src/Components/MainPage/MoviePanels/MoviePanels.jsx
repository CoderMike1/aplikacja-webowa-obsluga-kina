
import './MoviePanels.css'

import m1 from '../../../assets/movie1.png'

const MoviePanels = () =>{


    const movies_now_playing = Array(10).fill(0)


    return (
        <div className="movie_panels__container">
            <div className="movie_panel__inner">
                <div className="movie_panel__header">
                    <h4>Gramy teraz</h4>
                </div>
                <div className="movie_panel_movie_list playing now">
                    {movies_now_playing.map((m)=>(
                        <div className="movie_panel__item">
                            <img src={m1}/>
                        </div>
                    ))}
                </div>

            </div>
            <div className="movie_panel__inner coming_soon">
                coming soon
            </div>
            <div className="movie_panel__inner special_events">
                special events
            </div>
        </div>
    )


}

export default MoviePanels