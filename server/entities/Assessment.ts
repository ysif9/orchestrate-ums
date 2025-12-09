import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Course } from './Course';
import { User } from './User';

export enum AssessmentType {
    Assignment = "assignment",
    Quiz = "quiz",
    Midterm = "midterm",
    Final = "final",
    Project = "project",
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

    constructor(title: string, course: Course, totalMarks: number, createdBy: User) {
        super();
        this.title = title;
        this.course = course;
        this.totalMarks = totalMarks;
        this.createdBy = createdBy;
    }
}
