import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Room } from './Room';

@Entity()
export class RoomAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Room)
    room!: Room;

    constructor(room: Room) {
        super();
        this.room = room;
    }
}
