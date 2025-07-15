import axios, { AxiosError } from 'axios';
import { startServer, stopServer } from '../source/server';
import { PrismaClient } from '@prisma/client';

const GUEST_A_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};


const prisma = new PrismaClient();

beforeEach(async () => {
    // Clear any test setup or state before each test
    await prisma.booking.deleteMany();
});

beforeAll(async () => {
    await startServer();
});

afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
    await stopServer();
});

describe('Extend booking endpoint', () => {
    const BASE_URL = 'http://localhost:8000/api/v1/booking';

    test('successfully extends booking when no overlap', async () => {
        const res1 = await axios.post(BASE_URL, GUEST_A_UNIT_1);
        expect(res1.status).toBe(200);
        const id = res1.data.id;

        const res2 = await axios.patch(
            `${BASE_URL}/${id}`,
            { additionalNights: 2 }
        );

        console.log(res2.data)
        expect(res2.status).toBe(200);
        expect(res2.data.numberOfNights).toBe(GUEST_A_UNIT_1.numberOfNights + 2);
    });

    test('returns 400 when bookingId is invalid', async () => {
        let error: any;
        try {
            await axios.patch(`${BASE_URL}/abc`, { additionalNights: 2 });
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual('Invalid booking number');
    });

    test('returns 400 when numberOfNights is invalid', async () => {
        const res = await axios.post(BASE_URL, GUEST_A_UNIT_1);
        const id = res.data.id;

        let error: any;
        try {
            await axios.patch(`${BASE_URL}/${id}`, { additionalNights: 0 });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual('Invalid number of nights');
    });


    test('returns 404 when booking id not found', async () => {
        const id = 999;

        let error: any;
        try {
            await axios.patch(`${BASE_URL}/${id}`, { additionalNights: 1 });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(404);
        expect(error.response.data).toEqual('Booking not found');
    });

    test('returns 400 when there is overlap in date range', async () => {
        const res1 = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
        expect(res1.status).toBe(200);

        const res2 = await axios.post(BASE_URL, {
            unitID: '1',
            guestName: 'GuestB',
            checkInDate: new Date(new Date().setDate(new Date().getDate() - 3)),
            numberOfNights: 2,
        });
        const id = res2.data.id;

        let error: any;
        try {
            await axios.patch(`${BASE_URL}/${id}`, { additionalNights: 3 });
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(
            'For the given check-in date, the unit is already occupied'
        );
    });
});

