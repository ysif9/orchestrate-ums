import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Parent } from './Parent';
import { Student } from './Student';

@Entity()
@Unique({ properties: ['parent', 'student'] })
export class ParentStudentLink extends BaseEntity {
    @ManyToOne(() => Parent)
    parent!: Parent;

    @ManyToOne(() => Student)
    student!: Student;

    @Property()
    linkedAt: Date = new Date();

    @Property({ nullable: true })
    linkingCode?: string; // Store the code used for linking (for audit purposes)

    constructor(parent: Parent, student: Student, linkingCode?: string) {
        super();
        this.parent = parent;
        this.student = student;
        this.linkingCode = linkingCode;
    }
}

