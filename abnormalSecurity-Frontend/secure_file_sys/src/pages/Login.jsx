import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../App";
import useLoader from "../components/Loader.jsx";
import { useDispatch } from "react-redux";
import { setAuth } from "../redux/authSlice";

const Login = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({});
    const { loader, setIsLoading } = useLoader();
    const dispatch = useDispatch();


    const handleInput = (e) => {
        setLoginData(p => {
            return { ...p, [e.target.name]: e.target.value };
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        fetch(`${API_URL}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        }).then((res) => res.json()).then(r => {
            setIsLoading(false);
            dispatch(setAuth(r));
            localStorage.setItem("authData", JSON.stringify(r));
            navigate("/");
        }).catch(e => {
            setIsLoading(false);
            alert(e.message);
        })
    }
    return (
        <>
            {loader}
            <div className="main-container">
                <div className="login-container">
                    <h1 className="login-title">Secure Share</h1>
                    <form className="login-form">
                        <input className="login-input" type="text" name="email" onChange={handleInput} placeholder="Email" />
                        <input className="login-input" type="password" name="password" onChange={handleInput} placeholder="Password" />
                        <button className="login-button" onClick={handleSubmit} type="submit">Log in</button>
                    </form>
                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                </div>
            </div>
        </>
    )
}

export default Login;