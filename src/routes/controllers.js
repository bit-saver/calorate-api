import fs from 'fs';
import fitbit from '../services/fitbit';

const parseDate = ( val ) => {
  const args = val.split( '-' );
  return {
    year: args[0],
    month: args[1],
    date: args[2]
  };
};

const getCalories = async ( req, res, next ) => {
  console.log( 'Getting calories...' );
  const year = new Date().getFullYear() + 1;
  const data = await fitbit.getCalories( year );
  res.json( data );
};

const getMonthly = async ( req, res, next ) => {
  const promises = [];
  const year = new Date().getFullYear() + 1;
  promises.push( fitbit.getCalories( year ) );
  promises.push( fitbit.getFat( year ) );
  promises.push( fitbit.getWeight( year ) );
  const months = [];
  await Promise.all( promises )
    .then( ( results ) => {
      console.log( 'Got results' );
      results.forEach( ( result ) => {
        const tempMonths = [];
        console.log( 'Iterating data for: ', result.type );
        result.data.forEach( ( vals ) => {
          const value = parseFloat( vals.value );
          if ( value !== 0 ) {
            const d = parseDate( vals.dateTime );
            const yearMonth = `${d.year}-${d.month}`;
            const monthData = tempMonths.filter( testMonth => testMonth.yearMonth === yearMonth );
            if ( monthData.length === 1 ) {
              monthData[0].count += 1;
              monthData[0].total += value;
            } else {
              tempMonths.push( {
                yearMonth,
                count: 1,
                total: value
              } );
            }
          }
        } );
        console.log( 'tempMonths\r\n', tempMonths );
        tempMonths.forEach( ( tempMonth ) => {
          const monthData = months.filter( testMonth => testMonth.yearMonth === tempMonth.yearMonth ); // eslint-disable-line max-len
          if ( monthData.length === 1 ) {
            monthData[0][result.type] = tempMonth.count
              ? ( tempMonth.total / tempMonth.count ).toFixed( 2 )
              : null;
          } else {
            months.push( {
              yearMonth: tempMonth.yearMonth,
              [result.type]: tempMonth.count ? ( tempMonth.total / tempMonth.count ).toFixed( 2 ) : null // eslint-disable-line max-len
            } );
          }
        } );
      } );
      res.json( months );
    } )
    .catch( ( err ) => {
      throw new Error( err );
    } );
};

const getDataSince = async ( req, res, next ) => {
  const data = await fitbit.getDataSince( 2015 );
  fs.writeFile( 'data.json', JSON.stringify( data ), ( err ) => {
    if ( err ) throw err;
  } );
  console.log( data );
  res.json( data );
};

export default {
  getCalories,
  getMonthly,
  getDataSince
};
