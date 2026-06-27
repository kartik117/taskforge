import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { registerAndVerify } from '../helpers/registerAndLogin';

async function createProject(app: Express, token: string, name: string): Promise<string> {
  const res = await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name });
  return res.body._id;
}

describe('tasks', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('creates a task on a project and lists it back in creation order', async () => {
    const owner = await registerAndVerify(app, 'taskowner1@example.com');
    const projectId = await createProject(app, owner.token, 'Backend Revamp');

    const create = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Set up CI pipeline', priority: 'high' });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe('todo');

    const list = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Set up CI pipeline');
  });

  it('moves a task across statuses like a kanban board', async () => {
    const owner = await registerAndVerify(app, 'taskowner2@example.com');
    const projectId = await createProject(app, owner.token, 'Kanban Demo');

    const create = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Write tests' });
    const taskId = create.body._id;

    const toInProgress = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'in_progress' });
    expect(toInProgress.body.status).toBe('in_progress');

    const toDone = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'done' });
    expect(toDone.body.status).toBe('done');
  });

  it('blocks a non-member from creating, updating, or deleting tasks on someone else\'s project', async () => {
    const owner = await registerAndVerify(app, 'taskowner3@example.com');
    const outsider = await registerAndVerify(app, 'outsider3@example.com');
    const projectId = await createProject(app, owner.token, 'Private Project');

    const createAttempt = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ title: 'Should not be allowed' });
    expect(createAttempt.status).toBe(403);

    const ownerCreate = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Real task' });
    const taskId = ownerCreate.body._id;

    const updateAttempt = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ status: 'done' });
    expect(updateAttempt.status).toBe(403);

    const deleteAttempt = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(deleteAttempt.status).toBe(403);
  });

  it('deletes a task', async () => {
    const owner = await registerAndVerify(app, 'taskowner4@example.com');
    const projectId = await createProject(app, owner.token, 'Cleanup');

    const create = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Delete me' });
    const taskId = create.body._id;

    const del = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${owner.token}`);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(list.body).toHaveLength(0);
  });

  it('rejects an invalid status transition value', async () => {
    const owner = await registerAndVerify(app, 'taskowner5@example.com');
    const projectId = await createProject(app, owner.token, 'Validation Demo');
    const create = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Validate me' });

    const res = await request(app)
      .patch(`/api/tasks/${create.body._id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'not-a-real-status' });
    expect(res.status).toBe(400);
  });
});
