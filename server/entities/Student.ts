import { Entity, Property } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'student' })
export class Student extends User {
    @Property()
    maxCredits: number = 18;

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Student);
    }
}
