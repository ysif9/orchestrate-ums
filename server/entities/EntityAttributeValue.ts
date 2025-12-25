import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Attribute, AttributeDataType } from './Attribute';
import { User } from './User';
import { Course } from './Course';
import { Department } from './Department';
import { Applicant } from './Applicant';
import { Program } from './Program';
import { ApplicationReview } from './ApplicationReview';
import { Assessment } from './Assessment';
import { Attachment } from './Attachment';
import { Booking } from './Booking';
import { CourseTA } from './CourseTA';

@Entity()
@Unique({ properties: ['entityId', 'entityType', 'attribute'] })
export class EntityAttributeValue extends BaseEntity {
    @ManyToOne(() => Attribute)
    attribute!: Attribute;

    @Property()
    entityId!: number;

    @Property()
    entityType!: string;

    @ManyToOne(() => User, { nullable: true, deleteRule: 'cascade' })
    user?: User;

    @ManyToOne(() => Course, { nullable: true, deleteRule: 'cascade' })
    course?: Course;

    @ManyToOne(() => Department, { nullable: true, deleteRule: 'cascade' })
    department?: Department;

    @ManyToOne(() => Applicant, { nullable: true, deleteRule: 'cascade' })
    applicant?: Applicant;

    @ManyToOne(() => Program, { nullable: true, deleteRule: 'cascade' })
    program?: Program;

    @ManyToOne(() => ApplicationReview, { nullable: true, deleteRule: 'cascade' })
    applicationReview?: ApplicationReview;

    @ManyToOne(() => Assessment, { nullable: true, deleteRule: 'cascade' })
    assessment?: Assessment;

    @ManyToOne(() => Attachment, { nullable: true, deleteRule: 'cascade' })
    attachment?: Attachment;

    @ManyToOne(() => Booking, { nullable: true, deleteRule: 'cascade' })
    booking?: Booking;

    @ManyToOne(() => CourseTA, { nullable: true, deleteRule: 'cascade' })
    courseTA?: CourseTA;

    @Property({ nullable: true })
    stringValue?: string;

    @Property({ nullable: true })
    numberValue?: number;

    @Property({ nullable: true })
    booleanValue?: boolean;

    @Property({ nullable: true })
    dateValue?: Date;

    constructor(attribute: Attribute, entityId: number, entityType: string) {
        super();
        this.attribute = attribute;
        this.entityId = entityId;
        this.entityType = entityType;
    }

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
