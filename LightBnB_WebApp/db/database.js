const { Pool } = require("pg");

const pool = new Pool ({
  user: 'afreeda', 
  host: 'localhost',
  database: 'lightbnb'
});

pool.connect();

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  const queryString = `SELECT * FROM users
  WHERE email = $1;`;

  return pool
    .query(queryString, [email.toLowerCase()])
    .then((user) => {
      return user.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    })
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `SELECT * FROM users
  WHERE id = $1;`;

  return pool
    .query(queryString, [id])
    .then((user) => {
      return user.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    })
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const queryString = `INSERT INTO users(name, email, password) VALUES ($1, $2, $3)
  RETURNING *;`;

  return pool
    .query(queryString, [user.name, user.email, user.password])
    .then((user) => {
      return user.rows[0];
    })
    .catch((err) => {
      console.log(err.message)
    });

};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;

  return pool
    .query(queryString, [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    })
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {

  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  let conditionString = '';
  let havingString = '';

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    conditionString += `city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    if (queryParams.length > 0) {
      conditionString += ` AND `
    }
    queryParams.push(`${options.owner_id}`);
    conditionString += `owner_id = $${queryParams.length}`
  }

  if(options.minimum_price_per_night) {
    if (queryParams.length > 0) {
      conditionString += ` AND `
    }
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    conditionString += `cost_per_night >= $${queryParams.length}`
  }

  if(options.maximum_price_per_night) {
    if (queryParams.length > 0) {
      conditionString += ` AND `
    }
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    conditionString += `cost_per_night <= $${queryParams.length}`
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    havingString += `avg(property_reviews.rating) >= $${queryParams.length}`
  }

  if (conditionString.length > 0){
    queryString += 'WHERE ' + conditionString + ' ';
  }

  queryParams.push(limit);
  queryString += `GROUP BY properties.id `

  if (havingString.length > 0){
    queryString += 'HAVING ' + havingString + ' ';
  }

  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);
  
  return pool.query(queryString, queryParams).then((res) => res.rows);

};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
