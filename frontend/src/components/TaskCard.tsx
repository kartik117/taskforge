import { Task, TaskStatus } from '../api/types';

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: null,
};

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: null,
  in_progress: 'todo',
  done: 'in_progress',
};

interface Props {
  task: Task;
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onMove, onDelete }: Props) {
  const next = NEXT_STATUS[task.status];
  const prev = PREV_STATUS[task.status];

  return (
    <div className={`task-card priority-${task.priority}`}>
      <div className="task-card-title">{task.title}</div>
      {task.description && <p className="muted">{task.description}</p>}
      <div className="task-card-footer">
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
        <div className="task-card-actions">
          {prev && (
            <button title="Move back" onClick={() => onMove(task._id, prev)}>
              ←
            </button>
          )}
          {next && (
            <button title="Move forward" onClick={() => onMove(task._id, next)}>
              →
            </button>
          )}
          <button title="Delete" onClick={() => onDelete(task._id)}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
