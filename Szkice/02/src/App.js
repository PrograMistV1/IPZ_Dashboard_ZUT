import {BrowserRouter as Router, Link, Route, Routes} from "react-router-dom";
import DashboardEmpty from "./pages/DashboardEmpty";
import LoginPage from "./pages/LoginPage";
import DashboardChart from "./pages/DashboardChart";
import DashboardNews from "./pages/DashboardNews";
import DashboardSelect from "./pages/DashboardSelect";

function App() {
    return (
        <Router>
            <nav style={{padding: "10px"}}>
                <Link to="/">Strona główna</Link> |{" "}
                <Link to="/dashboard">Dashboard</Link> |{" "}
                <Link to="/dashboard/chart">Wykres</Link> |{" "}
                <Link to="/dashboard/news">News</Link> |{" "}
                <Link to="/dashboard/select">Wybierz</Link> |{" "}
                <Link to="/login">Login</Link>
            </nav>

            <Routes>
                <Route path="/" element={<h1>Witaj w projekcie Szkice 02!</h1>}/>
                <Route path="/dashboard" element={<DashboardEmpty/>}/>
                <Route path="/dashboard/chart" element={<DashboardChart/>}/>
                <Route path="/dashboard/news" element={<DashboardNews/>}/>
                <Route path="/dashboard/select" element={<DashboardSelect/>}/>
                <Route path="/login" element={<LoginPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;
