import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ProjectsService } from './projects/projects.service';
import { ReportsService } from './reports/reports.service';
import { Role } from './common/enums/role.enum';
import { TaskPriority } from './common/enums/task-priority.enum';
import { TaskStatus } from './common/enums/task-status.enum';
import { ReviewAction } from './common/enums/review-action.enum';
import type { UserDocument } from './users/schemas/user.schema';
import type { ProjectDocument } from './projects/schemas/project.schema';
import type { ReportDocument } from './reports/schemas/report.schema';

const TEAM = [
  { name: 'Sabare Test', email: 'sabare@test.com' },
  { name: 'Priya Nair', email: 'priya@test.com' },
  { name: 'Dilan Perera', email: 'dilan@test.com' },
  { name: 'Amara Silva', email: 'amara@test.com' },
];

const PROJECTS = [
  { name: 'Client A', description: 'External client engagement' },
  { name: 'Internal Tooling', description: 'Internal developer tools' },
  { name: 'R&D', description: 'Research and prototyping' },
];

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weeksAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return mondayOf(d);
}

function sampleContent(seedIndex: number) {
  return {
    tasksCompleted: [
      {
        taskName: `Feature work #${seedIndex}`,
        priority: TaskPriority.HIGH,
        plannedPercent: 100,
        actualPercent: 90 + (seedIndex % 10),
        status: TaskStatus.COMPLETED,
        timePlannedHours: 8,
        timeSpentHours: 9,
        output: 'Shipped to staging',
      },
      {
        taskName: `Bug fixes batch #${seedIndex}`,
        priority: TaskPriority.MEDIUM,
        plannedPercent: 100,
        actualPercent: 100,
        status: TaskStatus.COMPLETED,
        timePlannedHours: 4,
        timeSpentHours: 3,
      },
    ],
    tasksPlannedNextWeek: [
      {
        taskName: `Next milestone #${seedIndex}`,
        priority: TaskPriority.MEDIUM,
        plannedPercent: 0,
        actualPercent: 0,
        status: TaskStatus.NOT_STARTED,
        timePlannedHours: 10,
        timeSpentHours: 0,
      },
    ],
    blockers:
      seedIndex % 3 === 0
        ? [
            {
              text: 'Waiting on API access from third-party vendor',
              isKey: true,
            },
          ]
        : [],
    achievements: [
      { text: `Hit sprint goal for week ${seedIndex}`, isKey: true },
    ],
    hoursByType: { Development: 20, Testing: 5, Meetings: 4, Documentation: 2 },
    notes: 'Solid, steady week.',
  };
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const projectsService = app.get(ProjectsService);
  const reportsService = app.get(ReportsService);

  // 1. Manager
  let manager = await usersService.findByEmail('manager@company.com');
  if (!manager) {
    const passwordHash = await bcrypt.hash('manager123', 12);
    manager = await usersService.create({
      name: 'Default Manager',
      email: 'manager@company.com',
      passwordHash,
      role: Role.MANAGER,
    });
    console.log('Created manager: manager@company.com / manager123');
  }

  // 2. Team members
  const memberDocs: UserDocument[] = [];
  for (const t of TEAM) {
    let user = await usersService.findByEmail(t.email);
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 12);
      user = await usersService.create({
        name: t.name,
        email: t.email,
        passwordHash,
        role: Role.TEAM_MEMBER,
      });
      console.log(`Created team member: ${t.email} / password123`);
    }
    memberDocs.push(user);
  }

  // 3. Projects
  const existingProjects = await projectsService.findAll(true);
  const projectDocs: ProjectDocument[] = [];
  for (const p of PROJECTS) {
    let project = existingProjects.find((e) => e.name === p.name);
    if (!project) {
      project = await projectsService.create(p, manager._id.toString());
      console.log(`Created project: ${p.name}`);
    }
    projectDocs.push(project);
  }

  // 4. Reports — 4 weeks back, varied statuses, per member
  let seedIndex = 0;
  for (const member of memberDocs) {
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      seedIndex++;
      const weekStart = weeksAgo(weekOffset);
      const project = projectDocs[seedIndex % projectDocs.length];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const memberId = member._id.toString();
      const managerId = manager._id.toString();

      let report: ReportDocument;
      try {
        report = await reportsService.create(memberId, {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          project: project._id.toString(),
        });
      } catch {
        // Already seeded this member/week on a previous run — skip, don't duplicate.
        console.log(
          `Report already exists for ${member.name}, week ${weekStart.toISOString().slice(0, 10)} — skipping`,
        );
        continue;
      }

      const reportId = report._id.toString();

      await reportsService.update(reportId, memberId, {
        content: sampleContent(seedIndex),
      });

      // Vary the final status by week offset so the dashboard has a mix:
      // oldest weeks approved, most recent still a draft
      if (weekOffset === 3) {
        // Approved: submit, then approve
        await reportsService.submit(reportId, memberId);
        await reportsService.review(reportId, managerId, {
          action: ReviewAction.APPROVED,
        });
      } else if (weekOffset === 2) {
        // Went through one correction cycle, then approved
        await reportsService.submit(reportId, memberId);
        await reportsService.review(reportId, managerId, {
          action: ReviewAction.CHANGES_REQUESTED,
          comment: 'Please add more detail to the blocker description.',
        });
        await reportsService.update(reportId, memberId, {
          content: sampleContent(seedIndex + 100),
        });
        await reportsService.submit(reportId, memberId);
        await reportsService.review(reportId, managerId, {
          action: ReviewAction.APPROVED,
        });
      } else if (weekOffset === 1) {
        // Submitted, awaiting review
        await reportsService.submit(reportId, memberId);
      }
      // weekOffset === 0 (current week): left as a draft

      console.log(
        `Seeded report for ${member.name}, week ${weekStart.toISOString().slice(0, 10)}`,
      );
    }
  }

  console.log('\nSeed complete.');
  console.log('Manager login: manager@company.com / manager123');
  console.log(
    'Team member login: any of sabare/priya/dilan/amara @test.com / password123',
  );

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
