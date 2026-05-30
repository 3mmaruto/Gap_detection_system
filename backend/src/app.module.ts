import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ScheduleModule } from './schedule/schedule.module';
import { LevelsModule } from './levels/levels.module';
import { GradesModule } from './grades/grades.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    SubjectsModule,
    PostsModule,
    NotificationsModule,
    ConversationsModule,
    ScheduleModule,
    LevelsModule,
    GradesModule,
  ],
})
export class AppModule {}
