import {BrowserRouter as Router, Link, Route, Routes} from "react-router-dom";
import DashboardEmpty from "./pages/DashboardEmpty";
import LoginPage from "./pages/LoginPage";

function App() {
    return (
        <Router>
            <nav style={{padding: "10px"}}>
                <Link to="/">Strona główna</Link> |{" "}
                <Link to="/dashboard">Dashboard</Link> |{" "}
                <Link to="/login">Login</Link>
            </nav>

            <Routes>
                <Route path="/" element={<h1>Witaj w projekcie Szkice 02!</h1>}/>
                <Route path="/dashboard" element={<DashboardEmpty/>}/>
                <Route path="/login" element={<LoginPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;
