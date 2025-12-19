import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Department extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  description?: string;


  constructor(name?: string) {
    super();
    if (name) this.name = name;
  }
}
