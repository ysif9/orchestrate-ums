// entities/ResourceAttributeValue.ts
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
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

  // REMOVE THE CONSTRUCTOR ENTIRELY — this was causing the TS2554 error!
}