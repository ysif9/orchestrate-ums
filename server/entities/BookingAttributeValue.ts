import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Booking } from './Booking';

@Entity()
export class BookingAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Booking)
    booking!: Booking;

    constructor(booking: Booking) {
        super();
        this.booking = booking;
    }
}
