import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
export let errorRate = new Rate('errors');

// k6 options
export let options = {
    vus: 10, // number of virtual users
    duration: '30s', // test duration
    cloud: {
        projectID: 3712529,
        // Test runs with the same name groups test runs together
        name: 'Test3'
      }
};

// Function to get JWT token
function getJWT() {
    const url = 'https://dev-api.joinconnexus.com/v1/auth/login';
    const payload = JSON.stringify({
        email: 'raoof+sadmin@neoito.com',
        password: 'Abcd@1234',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let response = http.post(url, payload, params);

    // Check if the token was successfully obtained
    check(response, {
      
        'is status 200': (r) => r.status === 200 || r.status === 201,

        'token received': (r) => r.json('token') !== '',
    });

    // Return the token
    return response.json('token');
}

export default function () {
    const token = getJWT(); // Get the JWT token

    // Set up the headers with the JWT token
    const params = {
        headers: {
            Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
        },
    };

    // Example API request using the JWT token
    const url = 'https://dev-api.joinconnexus.com/v1';
    let response = http.get(url, params);

    // Check the response
    const success = check(response, {
        'is status 200': (r) => r.status === 200 || r.status === 201,

        'content present': (r) => r.body.indexOf('expected-content') !== -1,
    });

    // Record errors for the metrics
    errorRate.add(!success);

    // Sleep for a short time between requests
    sleep(1);
}
