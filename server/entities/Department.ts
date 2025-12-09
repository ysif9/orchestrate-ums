// entities/Department.ts
import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Allocation } from './Allocation';

@Entity()
export class Department extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @OneToMany('Allocation', 'allocatedToDepartment')
  allocations = new Collection<Allocation>(this);

  constructor(name?: string) {
    super();
    if (name) this.name = name;
  }
}
