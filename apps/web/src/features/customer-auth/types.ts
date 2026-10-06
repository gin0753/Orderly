export type PublicCustomer = { id: string; email: string; name: string | null; phone: string | null; authMethods: { password: boolean; google: boolean } };
export type CustomerAuthResponse = { user: PublicCustomer };
export type CustomerLoginInput = { email: string; password: string };
export type CustomerRegisterInput = CustomerLoginInput & { name: string };
