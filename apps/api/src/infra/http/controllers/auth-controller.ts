import type { RequestHandler } from 'express';
import type { AuthenticateUser } from '../../../application/use-cases/authenticate-user.js';
import type { RegisterUser } from '../../../application/use-cases/register-user.js';
import { loginBodySchema, registerBodySchema } from '../schemas/auth-schemas.js';

// Zod errors thrown by parse() reach the error handler, which turns them into 400.
export function createRegisterController(registerUser: RegisterUser): RequestHandler {
  return async (request, response) => {
    const input = registerBodySchema.parse(request.body);
    const output = await registerUser.execute(input);
    response.status(201).json(output);
  };
}

export function createLoginController(authenticateUser: AuthenticateUser): RequestHandler {
  return async (request, response) => {
    const input = loginBodySchema.parse(request.body);
    const output = await authenticateUser.execute(input);
    response.status(200).json(output);
  };
}
