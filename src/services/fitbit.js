import Request from 'request';
import fs from 'fs';
import moment from 'moment';
import { parseDate } from '../utils';

const fitbitCreds = JSON.parse( fs.readFileSync( `${process.cwd()}/fitbit.json`, 'utf8' ) );

const buildQuery = ( args ) => {
  const queryArgs = [];
  Object.keys( args ).forEach( ( key ) => {
    if ( {}.hasOwnProperty.call( args, key ) ) {
      const val = args[key];
      queryArgs.push( `${key}=${encodeURIComponent( val )}` );
    }
  } );
  return queryArgs.join( '&' );
};

const exp = {};

exp.getTokenFromCode = ( code ) => {
  const decoded = `${process.env.FITBIT_ID}:${process.env.FITBIT_SECRET}`;
  const auth = new Buffer( decoded ).toString( 'base64' ); // eslint-disable-line no-buffer-constructor
  return new Promise( ( resolve, reject ) => {
    Request.post(
      {
        url: process.env.FITBIT_TOKEN_URI,
        headers: {
          Authorization: `Basic ${auth}`
        },
        form: {
          code,
          grant_type: 'authorization_code',
          client_id: process.env.FITBIT_ID,
          redirect_uri: process.env.FITBIT_CALLBACK
        },
        json: true
      },
      ( error, response, body ) => {
        if ( error ) {
          return reject( error );
        }
        fs.writeFileSync( `${process.cwd()}/fitbit.json`, JSON.stringify( body ) );
        resolve( body );
      }
    );
  } );
};

exp.refreshToken = () => {
  const decoded = `${process.env.FITBIT_ID}:${process.env.FITBIT_SECRET}`;
  const auth = new Buffer( decoded ).toString( 'base64' ); // eslint-disable-line no-buffer-constructor
  return new Promise( ( resolve, reject ) => {
    Request.post(
      {
        url: process.env.FITBIT_TOKEN_URI,
        headers: {
          Authorization: `Basic ${auth}`
        },
        form: {
          grant_type: 'refresh_token',
          refresh_token: fitbitCreds.refresh_token
        },
        json: true
      },
      ( error, response, body ) => {
        if ( error ) {
          return reject( error );
        }
        fs.writeFileSync( `${process.cwd()}/fitbit.json`, JSON.stringify( body ) );
        resolve( body );
      }
    );
  } );
};

exp.getAuthRedirect = () => {
  const qs = {
    client_id: process.env.FITBIT_ID,
    response_type: 'code',
    scope: 'nutrition weight',
    redirect_uri: process.env.FITBIT_CALLBACK
  };
  return `${process.env.FITBIT_AUTH}?${buildQuery( qs )}`;
};

exp.getCalories = ( year ) => {
  console.log( 'Getting calories for: ', year );
  const url = `${process.env.FITBIT_USER_API}foods/log/caloriesIn/date/${year}-01-01/1y.json`;
  return new Promise( ( resolve, reject ) => {
    Request.get(
      {
        url,
        json: true,
        headers: {
          Authorization: `Bearer ${fitbitCreds.access_token}`
        }
      },
      ( error, response, body ) => {
        if ( error ) {
          return reject( error );
        }
        resolve( { type: 'calories', data: body['foods-log-caloriesIn'] } );
      }
    );
  } );
};

exp.getFat = ( year ) => {
  console.log( 'Getting fat for: ', year );
  const url = `${process.env.FITBIT_USER_API}body/fat/date/${year}-01-01/1y.json`;
  return new Promise( ( resolve, reject ) => {
    Request.get(
      {
        url,
        json: true,
        headers: {
          Authorization: `Bearer ${fitbitCreds.access_token}`
        }
      },
      ( error, response, body ) => {
        if ( error ) {
          return reject( error );
        }
        resolve( { type: 'fat', data: body['body-fat'] } );
      }
    );
  } );
};

exp.getWeight = ( year ) => {
  console.log( 'Getting weight for: ', year );
  const url = `${process.env.FITBIT_USER_API}body/weight/date/${year}-01-01/1y.json`;
  return new Promise( ( resolve, reject ) => {
    Request.get(
      {
        url,
        json: true,
        headers: {
          Authorization: `Bearer ${fitbitCreds.access_token}`,
          'Accept-Language': 'en_US'
        }
      },
      ( error, response, body ) => {
        console.log( error, body );
        if ( error ) {
          return reject( error );
        }
        resolve( { type: 'weight', data: body['body-weight'] } );
      }
    );
  } );
};

exp.getDataSince = async ( year ) => {
  console.log( `Getting data since 1/1/${year}` );
  const curYear = new Date().getFullYear();
  const data = [];
  const promises = [];
  for ( let y = year + 1; y <= curYear + 1; y += 1 ) {
    promises.push( exp.getCalories( y ) );
    promises.push( exp.getFat( y ) );
    promises.push( exp.getWeight( y ) );
  }
  await Promise.all( promises )
    .then( ( results ) => {
      results.forEach( ( result ) => {
        console.log( result );
        if ( result.data && result.data.length > 0 ) {
          result.data.forEach( ( vals ) => {
            const value = parseFloat( vals.value );
            if ( value !== 0 && moment( vals.dateTime ).isBefore() ) {
              const d = parseDate( vals.dateTime );
              const yearMonth = `${d.year}-${d.month}`;
              const dateTime = vals.dateTime; // eslint-disable-line prefer-destructuring
              const foundData = data.filter( test => test.dateTime === dateTime );
              if ( foundData.length === 1 ) foundData[0][result.type] = value;
              else {
                const temp = {
                  yearMonth,
                  dateTime,
                  weight: null,
                  fat: null,
                  calories: null
                };
                temp[result.type] = value;
                data.push( temp );
              }
            }
          } );
        }
      } );
    } )
    .catch( ( err ) => {
      throw new Error( err );
    } );
  return data;
};

export default exp;
