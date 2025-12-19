import { Entity, Property, ManyToOne, Enum, Collection, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Course } from './Course';
import { User } from './User';
import { EntityAttributeValue } from './EntityAttributeValue';


//@Observation
//Assessment type can be replaced with int
//Attributes are unpredictable

// @Solution
// Switch to EAV and INT


export enum AssessmentType {
    Assignment = 1,
    Quiz = 2,
    Midterm = 3,
    Final = 4,
    Project = 5,
}

@Entity()
export class Assessment extends BaseEntity {
    @Property()
    title!: string;

    @Property({ nullable: true })
    description?: string;

    @Enum({ items: () => AssessmentType })
    type: AssessmentType = AssessmentType.Assignment;

    @ManyToOne(() => Course)
    course!: Course;

    @Property()
    totalMarks!: number;

    @Property({ nullable: true })
    dueDate?: Date;

    @ManyToOne(() => User)
    createdBy!: User;

    @OneToMany(() => EntityAttributeValue, eav => eav.assessment)
    attributes = new Collection<EntityAttributeValue>(this);

    constructor(title: string, course: Course, totalMarks: number, createdBy: User) {
        super();
        this.title = title;
        this.course = course;
        this.totalMarks = totalMarks;
        this.createdBy = createdBy;
    }
}
