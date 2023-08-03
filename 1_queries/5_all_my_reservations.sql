SELECT reservations.id as id, properties.title as title, properties.cost_per_night as cost_per_night, reservations.start_date as start_date, avg(property_reviews.rating) as average_rating
FROM property_reviews
JOIN properties ON property_reviews.property_id = properties.id
JOIN reservations ON properties.id = reservations.property_id
JOIN users ON reservations.guest_id = users.id
WHERE users.email = 'tristanjacobs@gmail.com'
GROUP BY reservations.id, properties.title, properties.cost_per_night, reservations.start_date
ORDER BY start_date
LIMIT 10;