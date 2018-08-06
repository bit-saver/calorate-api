require( 'dotenv' ).config();

import http from 'http';
import app from './server';

// Used for module hot reloading, will maintain state
const server = http.createServer( app );
let currentApp = app;
const PORT = process.env.PORT || 8080;

server.listen( PORT, () => {
  console.log( `Calorate service listening on port: ${PORT}` );
} );

if ( module.hot ) {
  module.hot.accept( ['./server'], () => {
    server.removeListener( 'request', currentApp );
    server.on( 'request', app );
    currentApp = app;
  } );
}
