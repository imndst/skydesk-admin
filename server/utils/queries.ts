export const FLIGHT_COLS = `id, airline, flight_number AS flightNumber, origin, destination,
  departure_at AS departureAt, arrival_at AS arrivalAt, price,
  seats_total AS seatsTotal, seats_available AS seatsAvailable`

export const HOTEL_COLS = `id, name, city, country, stars, price,
  rooms_total AS roomsTotal, rooms_available AS roomsAvailable`

export const BOOKING_SELECT = `SELECT b.id, b.reference, b.type, b.flight_id AS flightId, b.hotel_id AS hotelId,
  b.customer_name AS customerName, b.customer_email AS customerEmail, b.customer_phone AS customerPhone,
  b.quantity, b.check_in AS checkIn, b.check_out AS checkOut, b.total,
  b.status, b.created_at AS createdAt,
  COALESCE(f.flight_number || ' ' || f.origin || ' ← ' || f.destination, h.name || '، ' || h.city) AS itemLabel
  FROM bookings b LEFT JOIN flights f ON f.id = b.flight_id LEFT JOIN hotels h ON h.id = b.hotel_id`

// Sort keys are mapped through allow-lists; user input never reaches the SQL text.
export const FLIGHT_SORT: Record<string, string> = { departure: 'departure_at', price: 'price', airline: 'airline', seats: 'seats_available' }
export const HOTEL_SORT: Record<string, string> = { name: 'name', city: 'city', stars: 'stars', price: 'price', rooms: 'rooms_available' }
export const BOOKING_SORT: Record<string, string> = { created: 'b.created_at', total: 'b.total', customer: 'b.customer_name' }
