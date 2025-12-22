import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { CourseTA } from './CourseTA';

@Entity()
export class CourseTAAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => CourseTA)
    courseTA!: CourseTA;

    constructor(courseTA: CourseTA) {
        super();
        this.courseTA = courseTA;
    }
}
