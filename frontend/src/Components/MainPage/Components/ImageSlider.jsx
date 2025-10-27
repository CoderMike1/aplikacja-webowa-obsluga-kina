import {useState} from "react";
import './ImageSlider.css'

const ImageSlider = ({slides}) =>{

    const [currentIndex,setCurrentIndex] = useState(0)

    const previous_slide = ()=>{
        if (currentIndex - 1<0){
            setCurrentIndex(slides.length-1)
        }
        else{
            setCurrentIndex(currentIndex-1)
        }
    }
    const next_slide = ()=>{
        setCurrentIndex((currentIndex+1)%slides.length)
    }
    console.log(currentIndex)
    return (
        <div className="slider">
            <div className="slide__arrow" onClick={()=>previous_slide()}>❮</div>
            <div className="slide__item">
                <img src={slides[currentIndex].url} alt={slides[currentIndex].title}/>
            </div>
            <div className="slide__arrow_right" onClick={()=>next_slide()}>❯</div>
        </div>
    )

}

export default ImageSlider