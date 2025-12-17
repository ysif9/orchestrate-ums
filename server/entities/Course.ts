import { Entity, Property, ManyToOne, ManyToMany, Collection, Embeddable, Embedded, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

export enum CourseType {
    Core = "Core",
    Elective = "Elective",
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
    type!: CourseType;

    @Property()
    credits!: number;

    @Property({ nullable: true })
    semester?: string;

    @Property()
    image: string = "https://placehold.co/600x400";

    @Property()
    subjectArea: string = "Science";


    @Enum({ items: () => Difficulty })
    difficulty: Difficulty = Difficulty.Introductory;

    @Property()
    pace: string = "Self-paced";

    @Property()
    professorName: string = "TBA";

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

    constructor(code: string, title: string, type: CourseType, credits: number) {
        super();
        this.code = code;
        this.title = title;
        this.type = type;
        this.credits = credits;
    }
}

export enum Difficulty {
    Introductory = "Introductory",
    Intermediate = "Intermediate",
    Advanced = "Advanced",
}