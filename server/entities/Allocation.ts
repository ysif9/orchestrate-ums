// entities/Allocation.ts
import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

export enum AllocationStatus {
  Active = 'active',
  Returned = 'returned',
  Expired = 'expired',
}

@Entity()
export class Allocation extends BaseEntity {
  @ManyToOne('Resource')
  resource!: any; // will be resolved by MikroORM

  @ManyToOne('User', { nullable: true })
  allocatedToUser?: any;

  @ManyToOne('Department', { nullable: true })
  allocatedToDepartment?: any;

  @Property()
  allocatedAt = new Date();

  @Property({ nullable: true })
  returnedAt?: Date;

  @Property({ nullable: true })
  dueDate?: Date;

  @Enum({ items: () => AllocationStatus })
  status: AllocationStatus = AllocationStatus.Active;

  @Property({ nullable: true })
  notes?: string;
}