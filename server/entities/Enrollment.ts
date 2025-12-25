import { Entity, Property, ManyToOne, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Course } from './Course';
import { Semester } from './Semester';

//@Observation
// Enrollment status can be replaced with int
//EAV is unnecessary for now but might be needed if requirements evolved


export enum EnrollmentStatus {
    Enrolled = 1,
    Completed = 2,
    Dropped = 3,
}

@Entity()
@Unique({ properties: ['student', 'course', 'semester'] })
export class Enrollment extends BaseEntity {
    @ManyToOne(() => User)
    student!: User;

    @ManyToOne(() => Course)
    course!: Course;

    @ManyToOne(() => Semester, { nullable: true })
    semester?: Semester;

    @Enum({ items: () => EnrollmentStatus })
    status: EnrollmentStatus = EnrollmentStatus.Enrolled;

    constructor(student: User, course: Course, semester: Semester) {
        super();
        this.student = student;
        this.course = course;
        this.semester = semester;
    }
}
