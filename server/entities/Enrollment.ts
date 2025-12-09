import { Entity, Property, ManyToOne, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Course } from './Course';

export enum EnrollmentStatus {
    Enrolled = "enrolled",
    Completed = "completed",
    Dropped = "dropped",
}

@Entity()
@Unique({ properties: ['student', 'course', 'semester'] })
export class Enrollment extends BaseEntity {
    @ManyToOne(() => User)
    student!: User;

    @ManyToOne(() => Course)
    course!: Course;

    @Property()
    semester!: string;

    @Enum({ items: () => EnrollmentStatus })
    status: EnrollmentStatus = EnrollmentStatus.Enrolled;

    constructor(student: User, course: Course, semester: string) {
        super();
        this.student = student;
        this.course = course;
        this.semester = semester;
    }
}
