import './NewsSlides.css'

import slide1 from "../../../../assets/slide1.webp"
import slide2 from '../../../../assets/slide2.jpeg'
import slide3 from '../../../../assets/slide3.jpeg'
import slide4 from '../../../../assets/slide4.webp'

import ImageSlider from "./ImageSlider.jsx";
const NewsSlides = () =>{

    const news = [
        {url:slide1,title:"i1"},
        {url:slide2,title:"i2"},
        {url:slide3,title:"i3"},
        {url:slide4,title:"i4"},
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