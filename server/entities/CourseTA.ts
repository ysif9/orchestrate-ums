import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { TeachingAssistant } from './TeachingAssistant';
import { Course } from './Course';

@Entity()
@Unique({ properties: ['ta', 'course'] })
export class CourseTA extends BaseEntity {
    @ManyToOne(() => TeachingAssistant)
    ta!: TeachingAssistant;

    @ManyToOne(() => Course)
    course!: Course;

    @Property({ type: 'text' })
    responsibilities!: string;

    @Property()
    assignedAt: Date = new Date();

    constructor(ta: TeachingAssistant, course: Course, responsibilities: string) {
        super();
        this.ta = ta;
        this.course = course;
        this.responsibilities = responsibilities;
    }
}
