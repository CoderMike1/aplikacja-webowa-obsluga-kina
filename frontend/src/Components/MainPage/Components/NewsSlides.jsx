import './NewsSlides.css'

import news1 from "../../../assets/news1.webp"
import news2 from '../../../assets/news 2.jpg'
import ImageSlider from "./ImageSlider.jsx";
const NewsSlides = () =>{

    const news = [
        {url:news1,title:"i1"},
        {url:news2,title:"i2"},
        {url:news1,title:"i3"},
        {url:news2,title:"i4"},
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