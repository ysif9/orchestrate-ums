// @ts-ignore
import { Entity, Property, Enum, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

import { User } from './User';
import {Room} from "./Room";


export enum ticket_status{

    open = "open",
    in_progress = "in_progress",
    resolved = "resolved",
}
export enum issue_type{
    hardware = "hardware",
    software = "software",
    other = "other",
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
    @Property({ nullable: true })
    description!: string | null;
    @Property({ nullable: true })
    created_by?: Date = new Date();
    @Property({ nullable: true })
    resolved_at?: Date;

        constructor(room: Room, user: User, description?: string) {
        super();
        this.room = room as unknown as Ref<Room>;
        this.user = user as unknown as Ref<User>;
        this.description = description ?? null;

    }
}