import { customAlphabet } from "nanoid";

export const makeBookingCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
