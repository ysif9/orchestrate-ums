import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { Attribute, AttributeDataType } from './Attribute';

@Entity({ abstract: true })
export abstract class BaseAttributeValue {
    @PrimaryKey()
    id!: number;

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @ManyToOne(() => Attribute)
    attribute!: Attribute;

    @Property({ nullable: true })
    stringValue?: string;

    @Property({ nullable: true })
    numberValue?: number;

    @Property({ nullable: true })
    booleanValue?: boolean;

    @Property({ nullable: true })
    dateValue?: Date;

    get value(): any {
        switch (this.attribute.dataType) {
            case AttributeDataType.String: return this.stringValue;
            case AttributeDataType.Number: return this.numberValue;
            case AttributeDataType.Boolean: return this.booleanValue;
            case AttributeDataType.Date: return this.dateValue;
            default: return this.stringValue;
        }
    }

    setValue(val: any) {
        this.stringValue = undefined;
        this.numberValue = undefined;
        this.booleanValue = undefined;
        this.dateValue = undefined;

        if (val === null || val === undefined) return;

        switch (this.attribute.dataType) {
            case AttributeDataType.String:
                this.stringValue = String(val);
                break;
            case AttributeDataType.Number:
                this.numberValue = Number(val);
                break;
            case AttributeDataType.Boolean:
                this.booleanValue = Boolean(val);
                break;
            case AttributeDataType.Date:
                this.dateValue = new Date(val);
                break;
            default:
                this.stringValue = String(val);
        }
    }
}
