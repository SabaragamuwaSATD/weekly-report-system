import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role } from './common/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'manager@company.com';
  const existing = await usersService.findByEmail(email);

  if (existing) {
    console.log('Manager already exists, skipping.');
  } else {
    const passwordHash = await bcrypt.hash('manager123', 12);
    await usersService.create({
      name: 'Default Manager',
      email,
      passwordHash,
      role: Role.MANAGER,
    });
    console.log(`Manager created: ${email} / manager123`);
  }

  await app.close();
}

seed();
