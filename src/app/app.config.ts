import { registerAs } from '@nestjs/config';
import * as Joi from '@hapi/joi';

export const appConfigValidationSchema = Joi.object({
  DB_TYPE: Joi.string().valid('postgres').required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().truthy('1').falsy('0').required(),
  DB_AUTOLOAD_ENTITIES: Joi.boolean().truthy('1').falsy('0').required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});

export default registerAs('app', () => ({
  db: {
    type: process.env.DB_TYPE as 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    autoLoadEntities: Boolean(process.env.DB_AUTOLOAD_ENTITIES),
    synchronize: Boolean(process.env.DB_SYNCHRONIZE),
  },
  environment: process.env.NODE_ENV || 'development',
}));
