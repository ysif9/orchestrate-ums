import { Entity, Property, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { DepartmentAttributeValue } from './DepartmentAttributeValue';
import { BaseEntity } from './BaseEntity';

//@Observation
// Seems fine, but EAV can be added for expandability


//@Solution
// Add EAV
@Entity()
export class Department extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @OneToMany(() => DepartmentAttributeValue, (av) => av.department, { cascade: [Cascade.ALL] })
  attributes = new Collection<DepartmentAttributeValue>(this);


  constructor(name?: string) {
    super();
    if (name) this.name = name;
  }
}
