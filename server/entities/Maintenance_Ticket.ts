// @ts-ignore
import { Entity, Property, Enum, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

import { User } from './User';
import { Room } from "./Room";


//@Observation
// Ticket status and issue type can be replaced with int
//Description needs to be mandatory

// @Solution
// Switch to INT and make Description mandatory

export enum ticket_status{

    open = 1,
    in_progress = 2,
    resolved = 3,
}
export enum issue_type {
    hardware = 1,
    software = 2,
    other = 3,
}

@Entity()
export class Maintenance_Ticket extends BaseEntity {
    @ManyToOne(() => Room, { ref: true })
    room!: Ref<Room>;
    @ManyToOne(() => User, { ref: true })
    user!: Ref<User>;
    @Enum({ items: () => ticket_status })
    status: ticket_status = ticket_status.open;
    @Enum({ items: () => issue_type })
    issue_type: issue_type = issue_type.other;
    @Property()
    description!: string;
    @Property({ nullable: true })
    created_by?: Date = new Date();
    @Property({ nullable: true })
    resolved_at?: Date;

    constructor(room: Room, user: User, description: string) {
        super();
        this.room = room as unknown as Ref<Room>;
        this.user = user as unknown as Ref<User>;
        this.description = description;

    }
}