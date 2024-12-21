import { useContext, createContext, useEffect, useState } from "react";

export const AuthContext = createContext({
    auth: null,
    setAuth: () => { }
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(JSON.parse(localStorage.getItem("authData") || "null"));
    useEffect(() => {
        if (auth) localStorage.setItem("authData", JSON.stringify(auth));
        else localStorage.removeItem("authData");
    }, [auth]);
    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;