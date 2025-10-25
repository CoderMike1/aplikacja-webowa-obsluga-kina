import './NewsSlides.css'

import news1 from "../../../assets/news1.webp"
import news2 from '../../../assets/news 2.jpg'
const NewsSlides = () =>{

    const news = [news1,news2]

    return (
        <div className="news_slides">
            <div className="news__inner">
                {news.map((n) => (
                    <div key={n} className="news__item">
                        <img src={n}/>
                    </div>
                ))}
            </div>
        </div>
    )


}

export default NewsSlides