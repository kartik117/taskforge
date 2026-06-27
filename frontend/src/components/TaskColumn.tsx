import { Task, TaskStatus } from '../api/types';
import { TaskCard } from './TaskCard';

interface Props {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export function TaskColumn({ title, status, tasks, onMove, onDelete }: Props) {
  const tasksInColumn = tasks.filter((t) => t.status === status);
  return (
    <div className="task-column">
      <h3>
        {title} <span className="muted">({tasksInColumn.length})</span>
      </h3>
      {tasksInColumn.map((task) => (
        <TaskCard key={task._id} task={task} onMove={onMove} onDelete={onDelete} />
      ))}
    </div>
  );
}
