import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@cadence.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@cadence.app",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("Created user:", user.email);

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo-org",
      description: "A demo organization for testing Cadence",
      plan: "free",
    },
  });

  console.log("Created organization:", org.name);

  // Create membership
  const membership = await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  console.log("Created membership for:", user.email);

  // Create demo team
  const team = await prisma.team.create({
    data: {
      name: "Engineering",
      description: "The engineering team",
      color: "#6366f1",
      organizationId: org.id,
    },
  });

  // Add user to team
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      memberId: membership.id,
      role: "ADMIN",
    },
  });

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: "Getting Started",
      description: "Your first project in Cadence",
      icon: "rocket",
      color: "#6366f1",
      status: "ON_TRACK",
      isPublic: true,
      organizationId: org.id,
      teamId: team.id,
      createdBy: user.id,
    },
  });

  console.log("Created project:", project.name);

  // Create sections
  const todoSection = await prisma.section.create({
    data: { name: "To Do", position: 0, projectId: project.id },
  });

  const inProgressSection = await prisma.section.create({
    data: { name: "In Progress", position: 1, projectId: project.id },
  });

  const doneSection = await prisma.section.create({
    data: { name: "Done", position: 2, projectId: project.id },
  });

  // Create demo labels
  const bugLabel = await prisma.label.upsert({
    where: { name_organizationId: { name: "Bug", organizationId: org.id } },
    update: {},
    create: { name: "Bug", color: "#ef4444", organizationId: org.id },
  });

  const featureLabel = await prisma.label.upsert({
    where: { name_organizationId: { name: "Feature", organizationId: org.id } },
    update: {},
    create: { name: "Feature", color: "#22c55e", organizationId: org.id },
  });

  const designLabel = await prisma.label.upsert({
    where: { name_organizationId: { name: "Design", organizationId: org.id } },
    update: {},
    create: { name: "Design", color: "#a855f7", organizationId: org.id },
  });

  // Create demo tasks
  const tasks = [
    {
      title: "Set up project structure",
      description: "Initialize the project with Next.js and configure the basic setup.",
      status: "DONE" as const,
      priority: "HIGH" as const,
      sectionId: doneSection.id,
      completedAt: new Date(),
    },
    {
      title: "Design the dashboard",
      description: "Create wireframes and mockups for the main dashboard page.",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      sectionId: inProgressSection.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Implement authentication",
      description: "Set up NextAuth.js with credentials and OAuth providers.",
      status: "TODO" as const,
      priority: "URGENT" as const,
      sectionId: todoSection.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Write API documentation",
      description: "Document all API endpoints using OpenAPI/Swagger.",
      status: "BACKLOG" as const,
      priority: "LOW" as const,
      sectionId: todoSection.id,
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      sectionId: todoSection.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = await prisma.task.create({
      data: {
        ...tasks[i],
        position: i + 1,
        organizationId: org.id,
        projectId: project.id,
        createdBy: user.id,
      },
    });

    // Assign some tasks
    if (i < 3) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          memberId: membership.id,
        },
      });
    }

    // Add labels to some tasks
    if (i === 0) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: featureLabel.id },
      });
    }
    if (i === 1) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: designLabel.id },
      });
    }
    if (i === 2) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: featureLabel.id },
      });
    }
  }

  console.log("Created tasks:", tasks.length);

  // Create a demo goal
  const goal = await prisma.goal.create({
    data: {
      title: "Launch MVP",
      description: "Ship the first version of the product",
      status: "ON_TRACK",
      period: "QUARTER",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      createdBy: user.id,
    },
  });

  // Create key results
  await prisma.keyResult.create({
    data: {
      title: "Complete core features",
      type: "PERCENTAGE",
      startValue: 0,
      targetValue: 100,
      currentValue: 25,
      status: "ON_TRACK",
      goalId: goal.id,
    },
  });

  await prisma.keyResult.create({
    data: {
      title: "Onboard 50 beta users",
      type: "NUMERIC",
      startValue: 0,
      targetValue: 50,
      currentValue: 12,
      status: "AT_RISK",
      goalId: goal.id,
    },
  });

  console.log("Created goal:", goal.title);

  // Create demo badges
  const badges = [
    { name: "First Task", description: "Complete your first task", icon: "star", xpReward: 10 },
    { name: "Early Bird", description: "Complete a task before its due date", icon: "sun", xpReward: 25 },
    { name: "Team Player", description: "Join a team", icon: "users", xpReward: 15 },
  ];

  for (const badge of badges) {
    await prisma.badge.create({
      data: { ...badge, organizationId: org.id },
    });
  }

  console.log("Created badges:", badges.length);

  // Create notifications
  const notificationTypes = [
    { type: "TASK_ASSIGNED", title: "New task assigned", body: "You've been assigned to 'Set up project structure'" },
    { type: "TASK_COMMENT", title: "New comment", body: "Someone commented on 'Design the dashboard'" },
    { type: "GOAL_CHECK_IN", title: "Goal update", body: "Launch MVP goal needs your attention" },
  ];

  for (const notif of notificationTypes) {
    await prisma.notification.create({
      data: {
        type: notif.type as any,
        title: notif.title,
        body: notif.body,
        userId: user.id,
        orgId: org.id,
      },
    });
  }

  console.log("Created notifications:", notificationTypes.length);

  // Create time entries for tasks
  const tasksForTime = await prisma.task.findMany({
    where: { organizationId: org.id, status: "DONE" },
    take: 2,
  });

  for (const task of tasksForTime) {
    await prisma.timeEntry.create({
      data: {
        description: `Worked on ${task.title}`,
        hours: Math.random() * 4 + 1,
        date: new Date(),
        billable: true,
        hourlyRate: 75,
        taskId: task.id,
        userId: user.id,
      },
    });
  }

  console.log("Created time entries");

  // Create task comments
  const commentTasks = await prisma.task.findMany({
    where: { organizationId: org.id },
    take: 3,
  });

  const comments = [
    "Great progress on this! Let me know if you need any help.",
    "I've pushed the latest changes. Ready for review.",
    "Let's discuss this in our next standup.",
  ];

  for (let i = 0; i < commentTasks.length && i < comments.length; i++) {
    await prisma.comment.create({
      data: {
        body: comments[i],
        taskId: commentTasks[i].id,
        authorId: user.id,
      },
    });
  }

  console.log("Created comments");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
