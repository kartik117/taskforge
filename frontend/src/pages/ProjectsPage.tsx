import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProject, listProjects } from '../api/endpoints';
import { Project } from '../api/types';
import { useAuth } from '../context/AuthContext';

export function ProjectsPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    listProjects(token)
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    const project = await createProject(token, name.trim());
    setProjects((prev) => [project, ...prev]);
    setName('');
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Your projects</h1>
        <div>
          <span className="muted">{user?.email}</span>
          <button className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">Create project</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <ul className="project-list">
        {projects.map((p) => (
          <li key={p._id}>
            <Link to={`/projects/${p._id}`}>{p.name}</Link>
            {p.description && <p className="muted">{p.description}</p>}
          </li>
        ))}
      </ul>
      {!loading && projects.length === 0 && <p className="muted">No projects yet -- create your first one above.</p>}
    </div>
  );
}
