import { Entity } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'professor' })
export class Professor extends User {
    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Professor);
    }
}
