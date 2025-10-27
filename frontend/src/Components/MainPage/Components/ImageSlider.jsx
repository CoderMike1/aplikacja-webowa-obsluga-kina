import {useState} from "react";
import './ImageSlider.css'

const ImageSlider = ({slides}) =>{

    const [currentIndex,setCurrentIndex] = useState(0)
    const [isFading, setIsFading] = useState(false)
    const FADE_MS = 300

    const previous_slide = ()=>{
        setIsFading(true)
        setTimeout(()=>{
            setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
            setIsFading(false)
        }, FADE_MS / 2)
    }

    const next_slide = ()=>{
        setIsFading(true)
        setTimeout(()=>{
            setCurrentIndex(prev => (prev + 1) % slides.length)
            setIsFading(false)
        }, FADE_MS / 2)
    }
    const specific_slide = (index) =>{
        setIsFading(true)
        setTimeout(()=>{
            setCurrentIndex(index)
            setIsFading(false)
        }, FADE_MS / 2)
    }
    return (
        <div className="slider">
            <div className="slide__arrow__left" onClick={previous_slide}>❮</div>
            <div className="slide__item">
                <img
                    className={isFading ? "fade is-fading" : "fade"}
                    src={slides[currentIndex].url}
                    alt={slides[currentIndex].title}
                    loading="lazy"
                />
            </div>
            <div className="slide__arrow__right" onClick={next_slide}>❯</div>
            <div className="slide__dots_select">
                {slides.map((slide,slideIndex)=>
                    <div className="slide__dot_item" key={slideIndex} onClick={()=>{specific_slide(slideIndex)}}>
                        {
                            currentIndex === slideIndex ? <>⚪</> :<>⚫</>
                        }
                    </div>
                )}
            </div>
        </div>
    )

}

export default ImageSlider

