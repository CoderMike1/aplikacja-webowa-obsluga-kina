import './Footer.css'
const Footer = () =>{

    return (
        <footer className="footer__container">
            <div className="footer_inner">
                    <div className="footer__info">
                        <div className="footer__item">
                            <h3>O nas:</h3>
                            <ul className="footer__list">
                                <li>Multiscreen: 7 sal z Dolby Atmos</li>
                                <li>Kawiarnia i strefa gier</li>
                                <li>Program lojalnościowy „Last Club”</li>
                                <li>Seanse specjalne: maratony, przedpremiery</li>
                                <li>Seanse przyjazne sensorycznie</li>
                            </ul>
                        </div>
                        <div className="footer__item">
                            <h3>Informacje:</h3>
                            <ul className="footer__list">
                                <li>Repertuar i bilety online</li>
                                <li>Cennik i zniżki (student/senior)</li>
                                <li>Regulamin kina</li>
                                <li>Godziny otwarcia i dojazd</li>
                                <li>Kontakt i FAQ</li>
                            </ul>
                        </div>
                        <div className="footer__item">
                            <h3>Social Media:</h3>
                            <ul className="footer__list">
                                <li>Facebook: @LastKino</li>
                                <li>Instagram: @lastkino_official</li>
                                <li>TikTok: @lastkino</li>
                                <li>YouTube: Last Kino</li>
                                <li>Newsletter: zapisz się</li>
                            </ul>

                        </div>
                    </div>
            </div>
        </footer>
    )

}

export default Footer

