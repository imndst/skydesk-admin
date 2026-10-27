import type { Theme } from '../theme'

export interface Paged<T> { items: T[], total: number, page: number, limit: number }
export interface Flight { id: number, airline: string, flightNumber: string, origin: string, destination: string, departureAt: string, arrivalAt: string, price: number, seatsTotal: number, seatsAvailable: number }
export interface Hotel { id: number, name: string, city: string, country: string, stars: number, price: number, roomsTotal: number, roomsAvailable: number }
export interface Booking { id: number, reference: string, type: 'flight' | 'hotel', flightId: number | null, hotelId: number | null, customerName: string, customerEmail: string, customerPhone: string, quantity: number, checkIn: string | null, checkOut: string | null, total: number, status: 'confirmed' | 'cancelled', createdAt: string, itemLabel: string }
export interface DashboardData { revenue: number, flightRevenue: number, hotelRevenue: number, confirmed: number, cancelled: number, seatsAvailable: number, roomsAvailable: number, flights: number, hotels: number, last7: { day: string, amount: number }[], recent: Booking[] }
export interface ThemeResponse { version: number, updatedAt: string | null, settings: Theme }
