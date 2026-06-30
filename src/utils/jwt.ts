const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'changeme') {
  throw new Error('JWT_SECRET is too weak or missing in production!');
}
 
export { JWT_SECRET }; 