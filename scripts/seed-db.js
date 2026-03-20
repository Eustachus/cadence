const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.acchqabawvlbggjysmix:UoAgpmiDTJU90O4a@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  console.log('Connecting to Supabase...');
  await client.connect();
  console.log('Connected! Seeding...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create user
  const userRes = await client.query(
    'INSERT INTO "User" (id, name, email, password, "emailVerified") VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (email) DO UPDATE SET name = $2 RETURNING id, email',
    ['user_demo_001', 'Demo User', 'demo@flowplan.app', hashedPassword]
  );
  const userId = userRes.rows[0].id;
  console.log('Created user:', userRes.rows[0].email);

  // Create organization
  const orgRes = await client.query(
    'INSERT INTO "Organization" (id, name, slug, description) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET name = $2 RETURNING id, name',
    ['org_demo_001', 'Demo Organization', 'demo-org', 'A demo organization']
  );
  const orgId = orgRes.rows[0].id;
  console.log('Created organization:', orgRes.rows[0].name);

  // Create membership
  await client.query(
    'INSERT INTO "Membership" (id, role, "userId", "organizationId") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", "organizationId") DO NOTHING',
    ['mem_demo_001', 'OWNER', userId, orgId]
  );
  console.log('Created membership');

  // Create team
  const teamRes = await client.query(
    'INSERT INTO "Team" (id, name, description, color, "organizationId") VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING id',
    ['team_demo_001', 'Engineering', 'The engineering team', '#6366f1', orgId]
  );
  const teamId = teamRes.rows[0]?.id || 'team_demo_001';
  console.log('Created team');

  // Create project
  const projRes = await client.query(
    'INSERT INTO "Project" (id, name, description, icon, color, status, "organizationId", "teamId", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING RETURNING id',
    ['proj_demo_001', 'Getting Started', 'Your first project in FlowPlan', 'rocket', '#6366f1', 'ON_TRACK', orgId, teamId, userId]
  );
  const projectId = projRes.rows[0]?.id || 'proj_demo_001';
  console.log('Created project');

  // Create sections
  const sections = ['To Do', 'In Progress', 'Done'];
  for (let i = 0; i < sections.length; i++) {
    await client.query(
      'INSERT INTO "Section" (id, name, position, "projectId") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [`section_demo_${i}`, sections[i], i, projectId]
    );
  }
  console.log('Created sections');

  // Create labels
  const labels = [
    { id: 'label_bug', name: 'Bug', color: '#ef4444' },
    { id: 'label_feature', name: 'Feature', color: '#22c55e' },
    { id: 'label_design', name: 'Design', color: '#a855f7' },
  ];
  for (const label of labels) {
    await client.query(
      'INSERT INTO "Label" (id, name, color, "organizationId") VALUES ($1, $2, $3, $4) ON CONFLICT (name, "organizationId") DO NOTHING',
      [label.id, label.name, label.color, orgId]
    );
  }
  console.log('Created labels');

  // Create tasks
  const tasks = [
    { id: 'task_001', title: 'Set up project structure', status: 'DONE', priority: 'HIGH', sectionId: 'section_demo_2' },
    { id: 'task_002', title: 'Design the dashboard', status: 'IN_PROGRESS', priority: 'MEDIUM', sectionId: 'section_demo_1' },
    { id: 'task_003', title: 'Implement authentication', status: 'TODO', priority: 'URGENT', sectionId: 'section_demo_0' },
    { id: 'task_004', title: 'Write API documentation', status: 'TODO', priority: 'LOW', sectionId: 'section_demo_0' },
    { id: 'task_005', title: 'Set up CI/CD pipeline', status: 'TODO', priority: 'MEDIUM', sectionId: 'section_demo_0' },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await client.query(
      'INSERT INTO "Task" (id, title, status, priority, position, "organizationId", "projectId", "sectionId", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING',
      [task.id, task.title, task.status, task.priority, i + 1, orgId, projectId, task.sectionId, userId]
    );
    
    // Assign first 3 tasks
    if (i < 3) {
      await client.query(
        'INSERT INTO "TaskAssignment" (id, "taskId", "memberId") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [`assign_${task.id}`, task.id, 'mem_demo_001']
      );
    }
  }
  console.log('Created tasks');

  // Create goal
  await client.query(
    'INSERT INTO "Goal" (id, title, description, status, period, "startDate", "endDate", "organizationId", "createdBy") VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL \'90 days\', $6, $7) ON CONFLICT DO NOTHING',
    ['goal_demo_001', 'Launch MVP', 'Ship the first version of the product', 'ON_TRACK', 'QUARTER', orgId, userId]
  );

  // Create key results
  await client.query(
    'INSERT INTO "KeyResult" (id, title, type, "startValue", "targetValue", "currentValue", "goalId") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
    ['kr_001', 'Complete core features', 'PERCENTAGE', 0, 100, 25, 'goal_demo_001']
  );
  await client.query(
    'INSERT INTO "KeyResult" (id, title, type, "startValue", "targetValue", "currentValue", "goalId") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
    ['kr_002', 'Onboard 50 beta users', 'NUMERIC', 0, 50, 12, 'goal_demo_001']
  );
  console.log('Created goal with key results');

  // Create badges
  const badges = [
    { id: 'badge_001', name: 'First Task', description: 'Complete your first task', icon: 'star', xp: 10 },
    { id: 'badge_002', name: 'Early Bird', description: 'Complete a task before due date', icon: 'sun', xp: 25 },
    { id: 'badge_003', name: 'Team Player', description: 'Join a team', icon: 'users', xp: 15 },
  ];
  for (const badge of badges) {
    await client.query(
      'INSERT INTO "Badge" (id, name, description, icon, "xpReward", "organizationId") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name, "organizationId") DO NOTHING',
      [badge.id, badge.name, badge.description, badge.icon, badge.xp, orgId]
    );
  }
  console.log('Created badges');

  // Create notifications
  const notifications = [
    { type: 'TASK_ASSIGNED', title: 'New task assigned', body: 'You have been assigned to a new task' },
    { type: 'TASK_COMMENT', title: 'New comment', body: 'Someone commented on your task' },
    { type: 'GOAL_CHECK_IN', title: 'Goal update', body: 'Your goal needs attention' },
  ];
  for (const notif of notifications) {
    await client.query(
      'INSERT INTO "Notification" (id, type, title, body, "userId", "orgId") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
      [`notif_${Math.random().toString(36).slice(2, 10)}`, notif.type, notif.title, notif.body, userId, orgId]
    );
  }
  console.log('Created notifications');

  await client.end();
  console.log('\nSeed completed successfully!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
