//komponent wyswietlajacy panel z filmami na stronie glownej
import './MoviePanels.css'
import {useRef} from "react";
import {Link} from "react-router-dom";
const MoviePanels = ({nowPlayingMovies,soonPlayingMovies,specialEvents}) =>{

    const v1 = useRef(null)
    const v2 = useRef(null);
    const v3 = useRef(null)


    const scrollByCard = (ref, dir = 1) => {
        const vp = ref.current;
        if (!vp) return;
        const cardW = parseFloat(getComputedStyle(vp).getPropertyValue("--item-w"));
        const gap = parseFloat(getComputedStyle(vp).getPropertyValue("--gap"));
        vp.scrollBy({ left: dir * (cardW + gap), behavior: "smooth" });
    };

    const Panel = ({title,listRef, items}) =>(
        <div className="movie_panel__inner">
            <h4 className="movie_panel__title">{title}</h4>

            <button className="movie_panel__btn left" onClick={()=>scrollByCard(listRef,-1)} aria-label="Prev">‹</button>

            <div className="movie_panel__viewport" ref={listRef}>
                <div className="movie_panel__list">
                    {items.map((movie) =>(
                        <Link
                            to={`/filmy/${movie.id}`}
                            key={movie.id}
                            className="movie_panel__card"
                        >
                        <img src={movie.poster_path} alt="" loading="lazy"/>
                        <div className="movie_panel__caption">{movie.title}</div>

                        </Link>
                    ))}
                </div>
            </div>

            <button className="movie_panel__btn right" onClick={() => scrollByCard(listRef, 1)} aria-label="Next">
                ›
            </button>

        </div>

    )

    return (
        <div className="movie_panels__container">
            <Panel items={nowPlayingMovies} title="Gramy teraz" listRef={v1}/>
            <Panel items={soonPlayingMovies} title="Wkrótce" listRef={v2}/>
            <Panel items={specialEvents} title="Wydarzenia specjalne" listRef={v3}/>
        </div>
    )


}

export default MoviePanels

