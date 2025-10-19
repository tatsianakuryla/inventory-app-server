import { Role } from "@prisma/client";

export type UserContext = { id: string | null; role: Role } | undefined;