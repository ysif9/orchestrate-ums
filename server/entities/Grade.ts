import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Assessment } from './Assessment';
import { User } from './User';

@Entity()
@Unique({ properties: ['assessment', 'student'] })
export class Grade extends BaseEntity {
    @ManyToOne(() => Assessment)
    assessment!: Assessment;

    @ManyToOne(() => User)
    student!: User;

    @Property({ nullable: true })
    score?: number;

    @Property({ nullable: true })
    feedback?: string;

    @ManyToOne(() => User, { nullable: true })
    gradedBy?: User;

    @Property()
    gradedAt: Date = new Date();

    constructor(assessment: Assessment, student: User) {
        super();
        this.assessment = assessment;
        this.student = student;
    }
}
