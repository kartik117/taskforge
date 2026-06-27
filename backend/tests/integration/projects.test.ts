import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { registerAndVerify } from '../helpers/registerAndLogin';

describe('projects', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('creates a project and lists it back for the owner', async () => {
    const owner = await registerAndVerify(app, 'owner1@example.com');

    const create = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Website Relaunch', description: 'Q3 redesign' });
    expect(create.status).toBe(201);
    expect(create.body.owner).toBe(owner.userId);

    const list = await request(app).get('/api/projects').set('Authorization', `Bearer ${owner.token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('Website Relaunch');
  });

  it('lets the owner add a member by email, and the member can then see the project', async () => {
    const owner = await registerAndVerify(app, 'owner2@example.com');
    const member = await registerAndVerify(app, 'member2@example.com');

    const create = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Mobile App' });
    const projectId = create.body._id;

    const before = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(before.status).toBe(403);

    const addMember = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'member2@example.com' });
    expect(addMember.status).toBe(200);

    const after = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(after.status).toBe(200);
  });

  it('refuses to let a non-owner add members or delete the project', async () => {
    const owner = await registerAndVerify(app, 'owner3@example.com');
    const member = await registerAndVerify(app, 'member3@example.com');

    const create = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Internal Tools' });
    const projectId = create.body._id;

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'member3@example.com' });

    const addAttempt = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ email: 'owner3@example.com' });
    expect(addAttempt.status).toBe(403);

    const deleteAttempt = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(deleteAttempt.status).toBe(403);
  });

  it('404s for a project that does not exist and for a malformed id', async () => {
    const owner = await registerAndVerify(app, 'owner4@example.com');
    const missing = await request(app)
      .get('/api/projects/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(missing.status).toBe(404);

    const malformed = await request(app)
      .get('/api/projects/not-an-object-id')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(malformed.status).toBe(404);
  });
});
