import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CourseDetails from './components/CourseDetails';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/course/:id" element={<CourseDetails />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;