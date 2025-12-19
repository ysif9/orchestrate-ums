import {
  Entity,
  Property,
  Enum,
  Unique,
  BeforeCreate,
  BeforeUpdate,
  EventArgs,
  ManyToOne,
} from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import * as bcrypt from 'bcrypt';
import { Department } from './Department';

export enum UserRole {
  Student = 'student',
  Staff = 'staff',
  Professor = 'professor',
  TeachingAssistant = 'teaching_assistant',
}

@Entity({ discriminatorColumn: 'role', abstract: true })
export abstract class User extends BaseEntity {
  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword(args: EventArgs<User>) {
    if (args.changeSet?.payload?.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @Property()
  name!: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Enum({ items: () => UserRole })
  role!: UserRole;

  // --- NEW profile fields shared by Professor / Staff / TA ---

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true })
  officeLocation?: string;

  @ManyToOne(() => Department, { nullable: true })
  department?: Department;

  constructor(name: string, email: string, password: string, role: UserRole) {
    super();
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  async comparePassword(password: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, this.password);
  }
}
