import { Entity, Property, Enum, Unique, BeforeCreate, BeforeUpdate, EventArgs } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  Student = "student",
  Staff = "staff",
  Professor = "professor",
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
