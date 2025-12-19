// entities/OfficeHours.ts
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User, UserRole } from './User';

@Entity()
export class OfficeHours extends BaseEntity {
  @ManyToOne(() => User)
  professor!: User;

  // e.g. 'monday', 'tuesday' etc. You can enforce enum in UI.
  @Property()
  dayOfWeek!: string;

  // Store as 'HH:MM' 24h strings for simplicity (e.g. '14:00')
  @Property()
  startTime!: string;

  @Property()
  endTime!: string;

  @Property()
  location!: string;

  // Optional: basic guard to ensure only professors are linked
  constructor(
    professor: User,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    location: string,
  ) {
    super();
    if (professor.role !== UserRole.Professor) {
      throw new Error('OfficeHours can only be assigned to a professor');
    }
    this.professor = professor;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.location = location;
  }
}
