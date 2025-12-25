import { Entity, Property, ManyToOne, ManyToMany, Collection, Embeddable, Embedded, Enum, Unique, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { CourseAttributeValue } from './CourseAttributeValue';
import { Semester } from './Semester';


//@Observation
// Enums can be replaced with int for performance
// Metadata like subjectArea, pace, image are unpredictable/sparse
// Redundant professorName (professor relation exists)
// Attributes are unpredictable (Syllabus, Resource Links, Video Intro)

//@Solution
// Switch to EAV and INT, Cleanup redundant fields

/**
 * Course type enum for categorizing core vs elective courses.
 * Using integers for better database performance.
 */
export enum CourseType {
    Core = 1,
    Elective = 2,
}

/**
 * Course difficulty levels.
 */
export enum Difficulty {
    Introductory = 1,
    Intermediate = 2,
    Advanced = 3,
}

@Embeddable()
export class Lesson {
    @Property()
    title!: string;

    @Property()
    content!: string;

    @Property()
    duration!: string;
}

@Entity()
export class Course extends BaseEntity {
    @Property()
    @Unique()
    code!: string;

    @Property()
    title!: string;

    @Property({ nullable: true })
    description?: string;

    @Enum({ items: () => CourseType })
    type: CourseType;

    @Property()
    credits!: number;

    @ManyToOne(() => Semester, { nullable: true })
    semester?: Semester;

    @Enum({ items: () => Difficulty })
    difficulty: Difficulty = Difficulty.Introductory;

    @Property()
    totalMarks: number = 100;

    @Property()
    passingMarks: number = 40;

    @ManyToOne(() => User, { nullable: true })
    professor?: User;

    @Embedded(() => Lesson, { array: true })
    lessons: Lesson[] = [];

    @ManyToMany(() => Course)
    prerequisites = new Collection<Course>(this);

    @ManyToOne(() => User, { nullable: true })
    createdBy?: User;

    @OneToMany(() => CourseAttributeValue, (eav) => eav.course, { cascade: ["all" as any] })
    attributes = new Collection<CourseAttributeValue>(this);

    constructor(code: string, title: string, type: CourseType, credits: number) {
        super();
        this.code = code;
        this.title = title;
        this.type = type;
        this.credits = credits;
    }
}