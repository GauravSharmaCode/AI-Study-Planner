import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, PlanStatus, TopicStatus, SessionStatus, RevisionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AI Schedule Service...');

  // User IDs from User Service (mocked)
  const userIds: string[] = [
    'user-uuid-1',
    'user-uuid-2',
    'user-uuid-3',
    'user-uuid-4',
    'user-uuid-5'
  ];

  // Clean up existing data for these users
  try {
    await prisma.studySession.deleteMany({ where: { studyPlan: { userId: { in: userIds } } } });
    await prisma.topic.deleteMany({ where: { studyPlan: { userId: { in: userIds } } } });
    await prisma.studyPlan.deleteMany({ where: { userId: { in: userIds } } });
    console.log('Cleaned up existing data.');
  } catch (e) {
    console.warn('Cleanup failed (expected if tables do not exist yet):', e);
  }

  // Create a complex study plan for User 1
  const userId = userIds[0];
  if (!userId) throw new Error("No user ID found");

  const plan = await prisma.studyPlan.create({
    data: {
      userId,
      examName: 'JEE Advanced 2026',
      targetCompletionDate: new Date('2026-05-25T00:00:00Z'),
      availableHoursPerDay: 6,
      preferredStartTime: '06:00',
      status: PlanStatus.ACTIVE,
      topics: {
        create: [
          {
            subject: 'Physics',
            name: 'Rotational Motion',
            difficulty: 5,
            estimatedMinutes: 600,
            status: TopicStatus.IN_PROGRESS,
          },
          {
            subject: 'Mathematics',
            name: 'Calculus: Limits',
            difficulty: 4,
            estimatedMinutes: 400,
            status: TopicStatus.PENDING,
          },
          {
            subject: 'Chemistry',
            name: 'Organic Chemistry: Basics',
            difficulty: 3,
            estimatedMinutes: 300,
            status: TopicStatus.COMPLETED,
            completedMinutes: 300
          }
        ]
      }
    },
    include: {
      topics: true
    }
  });

  // Explicitly casting or checking if topics exist to satisfy TS if inference fails
  const topics = plan.topics;

  console.log(`Created plan for user ${userId} with ${topics.length} topics.`);

  // Create sessions for the first topic (Rotational Motion)
  const topic = topics.find((t: any) => t.name === 'Rotational Motion');
  if (topic) {
    await prisma.studySession.createMany({
      data: [
        {
          studyPlanId: plan.id,
          topicId: topic.id,
          date: new Date(new Date().setUTCHours(0, 0, 0, 0)), // Today
          startTime: '06:00',
          endTime: '07:30',
          durationMinutes: 90,
          status: SessionStatus.COMPLETED,
          completedMinutes: 90,
          isRevision: false
        },
        {
          studyPlanId: plan.id,
          topicId: topic.id,
          date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
          startTime: '06:00',
          endTime: '07:30',
          durationMinutes: 90,
          status: SessionStatus.PENDING,
          isRevision: false
        }
      ]
    });
    console.log(`Created sessions for topic: ${topic.name}`);
  }

  // Create mock plans for other users
  for (let i = 1; i < userIds.length; i++) {
    const uid = userIds[i];
    if(!uid) continue;
    await prisma.studyPlan.create({
      data: {
        userId: uid,
        examName: `Mock Exam ${i}`,
        targetCompletionDate: new Date('2026-12-31T00:00:00Z'),
        availableHoursPerDay: 4,
        status: PlanStatus.ACTIVE
      }
    });
  }
  console.log(`Created simple plans for other ${userIds.length - 1} users.`);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
