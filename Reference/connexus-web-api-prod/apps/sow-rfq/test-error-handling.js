// Simple test to verify error handling logic
const {
  buildBaseVendorWhere,
  buildGeographicFilter,
  determineVendorMatch,
} = require('./src/services/rfp/helpers/vendor-matching.helper');

console.log('Testing error handling in helper functions...');

// Test buildBaseVendorWhere with null input
try {
  const result1 = buildBaseVendorWhere(null);
  console.log('✓ buildBaseVendorWhere handles null input:', result1);
} catch (error) {
  console.log('✗ buildBaseVendorWhere failed with null input:', error.message);
}

// Test buildGeographicFilter with null input
try {
  const result2 = buildGeographicFilter(null);
  console.log('✓ buildGeographicFilter handles null input:', result2);
} catch (error) {
  console.log('✗ buildGeographicFilter failed with null input:', error.message);
}

// Test buildGeographicFilter with missing stateId
try {
  const result3 = buildGeographicFilter({ stateId: null, cityId: 'city-123' });
  console.log('✓ buildGeographicFilter handles missing stateId:', result3);
} catch (error) {
  console.log(
    '✗ buildGeographicFilter failed with missing stateId:',
    error.message,
  );
}

// Test determineVendorMatch with null inputs
try {
  const result4 = determineVendorMatch(null, null);
  console.log('✓ determineVendorMatch handles null inputs:', result4);
} catch (error) {
  console.log('✗ determineVendorMatch failed with null inputs:', error.message);
}

console.log('Error handling tests completed.');
