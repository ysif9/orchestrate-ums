import { Entity } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'staff' })
export class Staff extends User {
    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Staff);
    }
}
