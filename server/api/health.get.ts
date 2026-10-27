import { stmt } from '../utils/db'
export default defineEventHandler(() => { stmt('SELECT 1').get(); return { ok: true } })
