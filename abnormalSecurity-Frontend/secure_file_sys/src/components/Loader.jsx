import { useState } from "react";

const Loader = () => {
    return (
        <div className="loader-container">
            <div className="loader"></div>
        </div>
    );
}

const useLoader = () => {
    const [isLoading, setIsLoading] = useState(false);
    return ({ loader: isLoading ? <Loader /> : null, setIsLoading });
}

export default useLoader;