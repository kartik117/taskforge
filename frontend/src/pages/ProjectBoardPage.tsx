import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addMember, createTask, deleteTask, getProject, listTasks, updateTask } from '../api/endpoints';
import { Project, Task, TaskPriority, TaskStatus } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { TaskColumn } from '../components/TaskColumn';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To do' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'done', title: 'Done' },
];

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !projectId) {
      navigate('/login');
      return;
    }
    Promise.all([getProject(token, projectId), listTasks(token, projectId)])
      .then(([p, t]) => {
        setProject(p);
        setTasks(t);
      })
      .catch((err) => setError(err.message));
  }, [token, projectId, navigate]);

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!token || !projectId || !title.trim()) return;
    const task = await createTask(token, projectId, { title: title.trim(), priority });
    setTasks((prev) => [...prev, task]);
    setTitle('');
  }

  async function handleMove(taskId: string, status: TaskStatus) {
    if (!token) return;
    const updated = await updateTask(token, taskId, { status });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  }

  async function handleDelete(taskId: string) {
    if (!token) return;
    await deleteTask(token, taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!token || !projectId || !memberEmail.trim()) return;
    try {
      const updated = await addMember(token, projectId, memberEmail.trim());
      setProject(updated);
      setMemberEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!project) return <p>Loading...</p>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link to="/projects">← All projects</Link>
          <h1>{project.name}</h1>
        </div>
      </header>

      <div className="board-toolbar">
        <form className="inline-form" onSubmit={handleAddTask}>
          <input placeholder="New task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit">Add task</button>
        </form>

        <form className="inline-form" onSubmit={handleAddMember}>
          <input
            type="email"
            placeholder="Invite by email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="submit">Add member</button>
        </form>
      </div>

      <div className="board">
        {COLUMNS.map((col) => (
          <TaskColumn
            key={col.status}
            title={col.title}
            status={col.status}
            tasks={tasks}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
