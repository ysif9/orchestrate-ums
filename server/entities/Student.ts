import { Entity, Property, Enum, Unique, BeforeCreate, OneToMany, Collection } from '@mikro-orm/core';
import { User, UserRole } from './User';
import { ParentStudentLink } from './ParentStudentLink';
import { randomBytes } from 'crypto';

export enum StudentStatus {
    Active = "active",
    Inactive = "inactive",
    OnHold = "on_hold",
    Suspended = "suspended",
    Graduated = "graduated",
}

@Entity({ discriminatorValue: 'student' })
export class Student extends User {
    @Property()
    maxCredits: number = 18;

    @Enum({ items: () => StudentStatus })
    status: StudentStatus = StudentStatus.Active;

    @Property()
    @Unique()
    linkingCode!: string;

    @OneToMany(() => ParentStudentLink, link => link.student)
    parentLinks = new Collection<ParentStudentLink>(this);

    @BeforeCreate()
    generateLinkingCode() {
        if (!this.linkingCode) {
            // Generate a unique 8-character alphanumeric code
            this.linkingCode = randomBytes(4).toString('hex').toUpperCase();
        }
    }

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Student);
    }
}
