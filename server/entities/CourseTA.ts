import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { TeachingAssistant } from './TeachingAssistant';
import { Course } from './Course';
import { CourseTAAttributeValue } from './CourseTAAttributeValue';
import { Collection, OneToMany } from '@mikro-orm/core';

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

    @OneToMany(() => CourseTAAttributeValue, (eav) => eav.courseTA, { cascade: ["all" as any] })
    attributes = new Collection<CourseTAAttributeValue>(this);

    constructor(ta: TeachingAssistant, course: Course, responsibilities: string) {
        super();
        this.ta = ta;
        this.course = course;
        this.responsibilities = responsibilities;
    }
}
