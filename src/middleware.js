import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

const middlewareSetup = ( app ) => {
  app.use( compression() );
  app.use( helmet() );
  app.use( cors() );
  app.use( bodyParser.json( { limit: '100mb' } ) );
  app.use( bodyParser.urlencoded( { extended: true } ) );

  if ( process.env.NODE_ENV === 'development' ) {
    app.use( morgan( 'dev' ) );
  } else {
    app.use( morgan( 'combined' ) );
  }
};

export default middlewareSetup;
