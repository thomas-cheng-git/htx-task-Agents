import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import TaskListPage from './pages/TaskListPage';
import CreateTaskPage from './pages/CreateTaskPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0f1117] text-[#e2e8f0]">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<TaskListPage />} />
            <Route path="/create" element={<CreateTaskPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
