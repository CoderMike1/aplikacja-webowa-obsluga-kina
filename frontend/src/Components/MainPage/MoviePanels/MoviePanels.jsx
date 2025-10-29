
import './MoviePanels.css'

import m1 from '../../../assets/movie1.png'
import m2 from '../../../assets/m2.jpg'
import m3 from '../../../assets/m3.jpg'
import {useRef} from "react";
const MoviePanels = () =>{

    const v1 = useRef(null)
    const v2 = useRef(null);
    const v3 = useRef(null)

    const movies_now_playing = [
        {
            title: "The Dark Knight",
            image: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
        },
        {
            title: "Joker",
            image: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
        },
        {
            title: "Avengers: Endgame",
            image: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
        },
        {
            title: "Titanic",
            image: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg"
        },
        {
            title: "Harry Potter and the Sorcerer’s Stone",
            image: "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg"
        },
        {
            title: "The Lord of the Rings: The Fellowship of the Ring",
            image: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg"
        },
        {
            title: "Black Panther",
            image: "https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg"
        },
        {
            title: "Guardians of the Galaxy",
            image: "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg"
        },
        {
            title: "Spider-Man: No Way Home",
            image: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg"
        },
        {
            title: "Doctor Strange in the Multiverse of Madness",
            image: "https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg"
        },
        {
            title: "The Batman",
            image: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg"
        },
        {
            title: "Frozen II",
            image: "https://image.tmdb.org/t/p/w500/qdfARIhgpgZOBh3vfNhWS4hmSo3.jpg"
        },
        {
            title: "Dune",
            image: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
        }
    ];
    const movies_soon = Array(8).fill(0)
    const movies_special_events = Array(8).fill(0)

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
                    {items.map((m) =>(
                        <div className="movie_panel__card" key={m.title}>
                            <img src={m.image} alt="" loading="lazy"/>
                            <div className="movie_panel__caption">{m.title}</div>
                        </div>
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
            <Panel items={movies_now_playing} title="Gramy teraz" listRef={v1}/>
            <Panel items={movies_now_playing} title="Wkrótce" listRef={v2}/>
            <Panel items={movies_now_playing} title="Wydarzenia specjalne" listRef={v3}/>
        </div>
    )


}

export default MoviePanels

