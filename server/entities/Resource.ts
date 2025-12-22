// entities/Resource.ts
import { Entity, Property, Enum, OneToMany, Collection, Index } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { ResourceAttributeValue } from './ResourceAttributeValue';
import { Allocation } from './Allocation';

//@Observation
// Resource type can be replaced with int



export enum ResourceType {
  Equipment = 1,
  SoftwareLicense = 2,
  Other = 3,
}

@Entity()
@Index({ properties: ['isAvailable'] })
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
  allocations = new Collection<Allocation>(this);

  @OneToMany(() => ResourceAttributeValue, (rav) => rav.resource)
  attributes = new Collection<ResourceAttributeValue>(this);

  constructor(name?: string, type?: ResourceType) {
    super();
    if (name) this.name = name;
    if (type) this.type = type;
  }
}
