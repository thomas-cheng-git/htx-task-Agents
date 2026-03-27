import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
      location.pathname === path
        ? 'bg-indigo-600 text-white'
        : 'text-slate-300 hover:text-white hover:bg-[#1e2130]'
    }`;

  return (
    <nav className="bg-[#13151f] border-b border-[#2d3148] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-white font-extrabold text-lg tracking-tight select-none">
          TaskFlow
        </span>
        <div className="flex gap-2">
          <Link to="/" className={navLinkClass('/')}>Task List</Link>
        </div>
      </div>
      <Link
        to="/create"
        className={`px-4 py-2 rounded text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          location.pathname === '/create'
            ? 'bg-indigo-600 text-white'
            : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
        }`}
      >
        + Create Task
      </Link>
    </nav>
  );
}
