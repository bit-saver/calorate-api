export const parseDate = ( val ) => {
  const args = val.split( '-' );
  return {
    year: args[0],
    month: args[1],
    date: args[2]
  };
};
