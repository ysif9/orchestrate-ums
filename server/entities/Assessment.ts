import { Entity, Property, ManyToOne, Enum, Collection, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Course } from './Course';
import { User } from './User';
import { AssessmentAttributeValue } from './AssessmentAttributeValue';


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

    @OneToMany(() => AssessmentAttributeValue, eav => eav.assessment, { cascade: ["all" as any] })
    attributes = new Collection<AssessmentAttributeValue>(this);

    constructor(title: string, course: Course, totalMarks: number, createdBy: User) {
        super();
        this.title = title;
        this.course = course;
        this.totalMarks = totalMarks;
        this.createdBy = createdBy;
    }
}
