import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
    return (
        <div className="not-found-page">

            <div className="background-shapes">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div className="not-found-content">

                <div className="error-number">
                    <span>4</span>
                    <div className="planet">
                        <div className="planet-ring"></div>
                    </div>
                    <span>4</span>
                </div>


                <h1>Page Not Found</h1>

                <p>
                    Oops! The page you are looking for doesn't exist
                    or has been moved.
                </p>


                <Link to="/" className="home-btn">
                    <span>←</span>
                    Back To Home
                </Link>

            </div>


        </div>
    );
};

export default NotFound;