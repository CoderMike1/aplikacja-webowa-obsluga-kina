
//glowna strona
import NewsSlides from "./NewsSlides/NewsSlides.jsx";
import MoviePanels from "./MoviePanels/MoviePanels.jsx";
import './MainPage.css'
const MainPage = () =>{

    return (
        <div className="main_page">
            <NewsSlides />
            <MoviePanels/>
        </div>
    )
}

export default MainPage