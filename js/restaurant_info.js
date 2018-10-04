let restaurant;
var newMap;

/**
 * Wait for user to click button to add a review
 */
const modal = document.getElementById('reviewModal');
const closeModalBtn = document.getElementById('closeModal');
const saveModalBtn = document.getElementById('saveModal');
const reviewBtn = document.getElementById('reviewBtn');

function closeModal() {
    modal.style.display = "none";
}

reviewBtn.addEventListener('click', () => {
    modal.style.display = "block";

    // don't allow user to click outside the modal
    window.onclick = function() {
       // ignore click
    };
});

closeModalBtn.addEventListener('click', () => {
    closeModal();
});

saveModalBtn.addEventListener('click', (event) => {
    event.preventDefault();
    // TODO validate form

    const reviewForm = document.forms['reviewForm'];
    const errorMessages = [];

    // check if name is empty
    if (!reviewForm['name'].value) {
        errorMessages.push('* Please enter your name');
    }

    // check if review is empty
    if(!reviewForm['review'].value) {
        errorMessages.push('* Please enter your review');
    }

    // get checked radio value
    let isChecked = false;
    for (let i=0; i < reviewForm['stars'].length; i++) {
        if(reviewForm['stars'][i].checked) {
            isChecked = true; // Found a checked radio button!
            break; // No need to continue the search
        }
    }
    if (!isChecked) {
        errorMessages.push('* Please select a rating');
    }

    // display error if there are any
    let errorBox = document.getElementById('errorMessages');
    if (errorMessages.length) {
        let messageString = '<ul>';
        for(let i = 0; i < errorMessages.length; i++) {
            messageString += '<li>' + errorMessages[i] + '</li>';
        }
        messageString += '</ul>';
        errorBox.innerHTML = messageString;
    } else {
        errorBox.innerHTML = '';
        closeModal();
    }

});


/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false,
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoicmF0cmFjZWdyYWQiLCJhIjoiY2ptbnh0bDNjMHNxazNwazR0MDA5Z3UzdiJ9.uBPRKglrewvJzjy3qkqRjA',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets',
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
};


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        let error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurantDetail(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
