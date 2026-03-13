// Script to set test user data in localStorage
// Run this in browser console to test the Home page

const testUser = {
  username: 'jsmith_nyc',
  email: 'john.smith@example.com',
  role: 'user',
  id: 123
};

localStorage.setItem('user', JSON.stringify(testUser));
localStorage.setItem('token', 'test_access_token_12345');

console.log('Test user data set in localStorage:');
console.log('User:', testUser);
console.log('Token: test_access_token_12345');
console.log('\nNavigate to /home to see the dashboard');