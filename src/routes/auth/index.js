import { Router } from 'express';
import fitbit from '../../services/fitbit';

const router = new Router();

router.get( '/', ( req, res, next ) => {
  const url = fitbit.getAuthRedirect();
  console.log( url );
  res.redirect( url );
} );

router.get( '/refresh', async ( req, res, next ) => {
  const tokens = await fitbit.refreshToken().catch( ( err ) => {
    throw new Error( err );
  } );
  console.log( tokens );
  res.json( tokens );
} );

router.get( '/callback', async ( req, res, next ) => {
  const code = req.query.code; // eslint-disable-line prefer-destructuring
  const tokens = await fitbit.getTokenFromCode( code );
  res.json( tokens );
} );

export default router;
