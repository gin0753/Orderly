export type PublicCustomer = { id: string; email: string; name: string | null; phone: string | null; authMethods: { password: boolean; google: boolean } };
export type CustomerAuthResponse = { user: PublicCustomer };
export type CustomerLoginInput = { email: string; password: string };
export type CustomerRegisterInput = { email: string; name: string; password?: string };

export type RegistrationResponse = { status: "pending" | "delivery_failed"; retryAfterSeconds: number };
