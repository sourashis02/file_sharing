import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../App";
import useLoader from "../components/Loader.jsx";

const Signup = () => {
    const [signupData, setSignupData] = useState({});
    const { loader, setIsLoading } = useLoader();
    const navigate = useNavigate();
    const handleInput = (e) => {
        setSignupData(p => {
            return { ...p, [e.target.name]: e.target.value };
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            fetch(`${API_URL}/auth/signup/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData)
            }).then((res) => res.json()).then(r => {
                setIsLoading(false);
                navigate("/login");
            }).catch(e => {
                setIsLoading(false);
                alert(e.message);
            })
        }, 2000);
    }
    return (
        <>
            {loader}
            <div className="main-container">
                <div className="login-container">
                    <h1 className="login-title">Secure Share</h1>
                    <form className="login-form">
                        <input className="login-input" type="text" name="name" onChange={handleInput} placeholder="name" />
                        <input className="login-input" type="email" name="email" onChange={handleInput} placeholder="Email" />
                        <input className="login-input" type="password" name="password" onChange={handleInput} placeholder="Password" />
                        <button className="login-button" onClick={handleSubmit} type="submit">Register</button>
                    </form>
                    <p>Already have an account? <Link to="/login">Log in</Link></p>
                </div>
            </div>
        </>

    )
}

export default Signup;