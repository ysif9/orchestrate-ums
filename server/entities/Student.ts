import { Entity, Property, Enum } from '@mikro-orm/core';
import { User, UserRole } from './User';

//@Observation
// Student status can be replaced with int

// @Solution
// Switch to INT

export enum StudentStatus {
    Active = 1,
    Inactive = 2,
    OnHold = 3,
    Suspended = 4,
    Graduated = 5,
}

@Entity({ discriminatorValue: 'student' })
export class Student extends User {
    @Property()
    maxCredits: number = 18;

    @Enum({ items: () => StudentStatus })
    status: StudentStatus = StudentStatus.Active;

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Student);
    }
}
