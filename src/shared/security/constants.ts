import * as dotenv from 'dotenv';

// Cargar las variables de entorno
dotenv.config();

export const jwtConstants = {
  JWT_SECRET: process.env.JWT_SECRET || 'defaultSecret',  // Usa un valor por defecto si no se encuentra la variable
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
};
