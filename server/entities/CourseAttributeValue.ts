import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Course } from './Course';

@Entity()
export class CourseAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Course)
    course!: Course;

    constructor(course: Course) {
        super();
        this.course = course;
    }
}
