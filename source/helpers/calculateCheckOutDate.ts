export function calculateCheckOutDate(checkInDate: Date, numberOfNights: number): Date {
    const result = new Date(checkInDate);
    result.setDate(result.getDate() + numberOfNights);
    return result;
}