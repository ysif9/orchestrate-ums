import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import AdminCourseManager from './pages/AdminCourseManager';
import './App.css';

function Home() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/')
            .then((response) => setMessage(response.data.message))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="App">
            <h1>Orchestrate UMS</h1>
            <p>{message}</p>
            <div className="card">
                <p>Welcome to the University Management System.</p>
                <Link to="/admin/courses">
                    <button>Go to Admin Course Manager</button>
                </Link>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin/courses" element={<AdminCourseManager />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;