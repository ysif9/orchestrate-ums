// entities/ResourceAttributeValue.ts
import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
@Unique({ properties: ['resource', 'attribute'] })
export class ResourceAttributeValue extends BaseEntity {
  @ManyToOne('Resource', { deleteRule: 'cascade' })
  resource!: any;

  @ManyToOne('ResourceAttribute')
  attribute!: any;

  @Property({ nullable: true })
  stringValue?: string;

  @Property({ nullable: true })
  numberValue?: number;

  @Property({ nullable: true })
  dateValue?: Date;

  @Property({ nullable: true })
  booleanValue?: boolean;
}
