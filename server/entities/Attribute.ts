import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';




export enum AttributeDataType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean',
}

@Entity()
@Unique({ properties: ['name', 'entityType'] })
export class Attribute extends BaseEntity {
  @Property()
  name!: string;

  @Property()
  label!: string;

  @Property({ nullable: true })
  description?: string;

  @Enum(() => AttributeDataType)
  dataType!: AttributeDataType;

  @Property()
  entityType!: string; // 'User', 'Course', 'Department', etc.

  @Property()
  isRequired: boolean = false;

  constructor(name: string, label: string, dataType: AttributeDataType, entityType: string) {
    super();
    this.name = name;
    this.label = label;
    this.dataType = dataType;
    this.entityType = entityType;
  }
}
