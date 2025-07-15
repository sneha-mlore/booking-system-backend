export interface Booking {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

export interface BookingRecord extends Booking {
    id: number;
}

export type BookingOutcome = {result:boolean, reason:string};
