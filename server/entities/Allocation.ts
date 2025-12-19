// entities/Allocation.ts
import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

// @Observation
// Append Heavy, EAV is a bad choice
// can be split by ID
// Has ambiguity, Too many Nulls, App level Validation is needed.


// @Solution
// Split by ID


export enum AllocationStatus {
  Active = 1,
  Returned = 2,
  Expired = 0,
}

export enum TargetType {
  User = 'user',
  Department = 'department',
}

@Entity()
export class AllocationTarget extends BaseEntity {
  @Property()
  name!: string;

  @Property()
  targetId!: number;

  @Enum({ items: () => TargetType, nullable: false })
  targetType = TargetType.Department;

  constructor(name: string, targetId: number, targetType: TargetType) {
    super();
    this.name = name;
    this.targetId = targetId;
    this.targetType = targetType;
  }
}



@Entity()
@Index({ properties: ['status'] })
@Index({ properties: ['dueDate'] })
@Index({ properties: ['allocatedAt'] })
export class Allocation extends BaseEntity {
  @ManyToOne(() => Resource)
  resource!: Resource;

  // This replaces the two nullable columns with one required target
  @ManyToOne(() => AllocationTarget)
  target!: AllocationTarget;

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


