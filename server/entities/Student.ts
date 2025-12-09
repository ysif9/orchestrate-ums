import { Entity, Property, Enum } from '@mikro-orm/core';
import { User, UserRole } from './User';

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

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Student);
    }
}
