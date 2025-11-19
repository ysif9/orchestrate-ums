import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetching from the backend
        axios
            .get('http://localhost:5000/')
            .then((response) => {
                setMessage(response.data.message);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);

    return (
        <>
            <h1>MERN Monorepo</h1>
            <div className="card">
                <p>Backend says: {message}</p>
            </div>
        </>
    );
}

export default App;