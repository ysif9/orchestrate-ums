// entities/Resource.ts
import { Entity, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

export enum ResourceType {
  Equipment = 'equipment',
  SoftwareLicense = 'software_license',
  Other = 'other',
}

@Entity()
export class Resource extends BaseEntity {
  @Property()
  name!: string;

  @Enum({ items: () => ResourceType })
  type!: ResourceType;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: true })
  isAvailable: boolean = true;

  @OneToMany('Allocation', 'resource')
  allocations = new Collection<any>(this);

  @OneToMany('ResourceAttributeValue', 'resource')
  attributes = new Collection<any>(this);

  constructor(name: string, type: ResourceType) {
    super();
    this.name = name;
    this.type = type;
  }
}