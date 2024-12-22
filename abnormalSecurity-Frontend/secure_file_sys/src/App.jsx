import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useSelector } from "react-redux";
import Signup from "./pages/Signup";


export const API_URL = "http://localhost:8000";


function App() {
  const { auth } = useSelector(state => state.auth);
  const router = createBrowserRouter([
    {
      path: "/login",
      element: !auth ? <Login /> : <Dashboard />
    },
    {
      path: "/signup",
      element: !auth ? <Signup /> : <Dashboard />
    },
    {
      path: "/",
      element: auth ? <Dashboard /> : <Login />
    }
  ]);
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App;
