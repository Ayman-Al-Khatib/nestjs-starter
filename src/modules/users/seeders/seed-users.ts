import { INestApplicationContext, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Gender } from 'domain/enums/gender.enum';
import { UserEntity } from 'modules/users/entities/user.entity';

// `cityId` values are bound to the order in seed-cities.ts.
export const userSeeds: Partial<UserEntity>[] = [
  {
    phone: '+963936000001',
    firstName: 'Ali',
    lastName: 'Hassan',
    gender: Gender.MALE,
    birthDate: new Date('1995-02-14'),
    cityId: 1,
    address: 'Mazzeh',
    isProfileCompleted: true,
  },
  {
    phone: '+963936000002',
    firstName: 'Nour',
    lastName: 'Hamdan',
    gender: Gender.FEMALE,
    birthDate: new Date('1998-07-09'),
    cityId: 2,
    address: 'Kafr Souseh',
    isProfileCompleted: true,
  },
  {
    phone: '+963936000003',
    firstName: 'Mahmoud',
    lastName: 'Qassem',
    gender: Gender.MALE,
    birthDate: new Date('1989-11-23'),
    cityId: 3,
    address: 'New Aleppo',
    isProfileCompleted: true,
  },
  {
    phone: '+963936000004',
    firstName: 'Rama',
    lastName: 'Najjar',
    gender: Gender.FEMALE,
    birthDate: new Date('2000-04-17'),
    cityId: 4,
    address: 'Al Waer',
    isProfileCompleted: true,
  },
  {
    phone: '+963936000005',
    firstName: 'Samer',
    lastName: 'Khoury',
    gender: Gender.MALE,
    birthDate: new Date('1992-01-30'),
    cityId: 5,
    address: 'Al Ziraa',
    isProfileCompleted: true,
  },
];

export async function seedUsers(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('seedUsers');
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(UserEntity);

  await userRepo.upsert(userSeeds, ['phone']);
  logger.debug(`Seeded ${userSeeds.length} users successfully.`);
}
