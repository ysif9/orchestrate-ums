// entities/ResourceAttribute.ts
import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

export enum AttributeDataType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean',
}

@Entity()
export class ResourceAttribute extends BaseEntity {
  @Property({ unique: true })
  key!: string; // e.g. g. "serial_number", "license_expiry"

  @Property()
  label!: string; // e.g. "Serial Number", "License Expiry Date"

  @Enum({ items: () => AttributeDataType })
  dataType!: AttributeDataType;

  constructor(key: string, label: string, dataType: AttributeDataType) {
    super();
    this.key = key;
    this.label = label;
    this.dataType = dataType;
  }
}