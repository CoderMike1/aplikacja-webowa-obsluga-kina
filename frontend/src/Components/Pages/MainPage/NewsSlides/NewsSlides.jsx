//komponent wyswietlajacy banery na stronie glownej

import './NewsSlides.css'

import slide1 from "../../../../assets/slide1.png"
import slide2 from '../../../../assets/slide2.png'

import ImageSlider from "./ImageSlider.jsx";
const NewsSlides = () =>{

    const news = [
        {url:slide1,title:"i1"},
        {url:slide2,title:"i2"}
    ]

    return (
        <div className="news_slider">
            <div className="news__inner">
                <ImageSlider slides={news}/>
            </div>
        </div>
    )


}


export default NewsSlides