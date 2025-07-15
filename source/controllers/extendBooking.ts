import {NextFunction, Request, Response} from "express";
import prisma from "../prisma";
import {calculateCheckOutDate} from "../helpers/calculateCheckOutDate";
import {BookingOutcome, BookingRecord} from "../interfaces/bookings";
import {isValidPositiveInteger} from "../helpers/isValidPositiveInteger";

interface ExtendBookingRequestBody {
    additionalNights: number;
}

const extendBooking = async (req: Request, res: Response, next: NextFunction) => {

    const bookingId = Number(req.params.id);

    // TODO: Use Zod for input validation
    if(!isValidPositiveInteger(bookingId)){
        return res.status(400).json('Invalid booking number');
    }

    if(!isValidPositiveInteger(req.body.additionalNights))
    {
        return res.status(400).json('Invalid number of nights');
    }

    const body: ExtendBookingRequestBody = req.body;

    const existingBooking = await prisma.booking.findUnique({
        where: {
            id:bookingId,
        },
    });

    if (!existingBooking) {
        return res.status(404).json('Booking not found');
    }

    const outcome = await isExtendBookingPossible(existingBooking, body.additionalNights);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    let updatedNumberOfNights = existingBooking.numberOfNights + body.additionalNights;
    let newCheckOutDate = calculateCheckOutDate(new Date(existingBooking.checkInDate), updatedNumberOfNights);

    let extendBooking = await prisma.booking.update({
        data: {
            checkOutDate: newCheckOutDate,
            numberOfNights: updatedNumberOfNights
        },
        where: {
            id: bookingId,
        }
    })

    return res.status(200).json(extendBooking);
}

export async function isExtendBookingPossible(
    booking: BookingRecord,
    additionalNights: number
): Promise<BookingOutcome> {
    const updatedNumberOfNights = booking.numberOfNights + additionalNights;

    const newCheckOutDate = calculateCheckOutDate(
        new Date(booking.checkInDate),
        updatedNumberOfNights
    );

    const overlapping = await prisma.booking.findMany({
        where: {
            unitID: booking.unitID,
            id: { not: booking.id },
            checkInDate: { lt: newCheckOutDate },
            checkOutDate: { gt: new Date(booking.checkInDate) },
        },
    });

    if (overlapping.length > 0) {
        return {result: false, reason: 'For the given check-in date, the unit is already occupied',};
    }

    return { result: true, reason: 'OK' };
}

export default extendBooking;