const BASE_URL = 'http://localhost:3001';

async function request(method: string, path: string, body?: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('Testing API Routes\n');
  console.log('='.repeat(50));

  let token = '';
  let userId = '';
  let roomId = '';

  // 1. Register
  console.log('\n POST /auth/register');
  const registerRes = await request('POST', '/auth/register', {
    email: 'testapi@test.com',
    username: 'testapi',
    password: 'password123'
  });
  console.log(`   Status: ${registerRes.status}`);
  console.log(`   Response: ${JSON.stringify(registerRes.data)}`);
  if (registerRes.status === 201) {
    token = registerRes.data.token;
    userId = registerRes.data.user.id;
    console.log(' ✅ Registered successfully');
  } else {
    console.log('User already exists, trying login...');
    
    const loginRes = await request('POST', '/auth/login', {
      email: 'testapi@test.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    userId = loginRes.data.user.id;
    console.log(' ✅ Logged in successfully');
  }

  // 2. Get Me
  console.log('\n GET /auth/me');
  const meRes = await request('GET', '/auth/me', undefined, token);
  console.log(`   Status: ${meRes.status}`);
  console.log(`   Response: ${JSON.stringify(meRes.data)}`);
  console.log(`   ${meRes.status === 200 ? '✅' : '❌'}`);

  // 3. Create Room
  console.log('\n POST /rooms (create room)');
  const createRoomRes = await request('POST', '/rooms', { name: 'Test Room' }, token);
  console.log(`   Status: ${createRoomRes.status}`);
  console.log(`   Response: ${JSON.stringify(createRoomRes.data)}`);
  if (createRoomRes.status === 201) {
    roomId = createRoomRes.data.room.id;
    console.log(' ✅ Room created');
  } else {
    console.log(' ❌ Failed to create room');
  }

  // 4. Get Rooms
  console.log('\n GET /rooms');
  const getRoomsRes = await request('GET', '/rooms', undefined, token);
  console.log(`   Status: ${getRoomsRes.status}`);
  console.log(`   Response: ${JSON.stringify(getRoomsRes.data)}`);
  console.log(`   ${getRoomsRes.status === 200 ? '✅' : '❌'}`);

  if (roomId) {
    // 5. Get Room Members
    console.log(`\n GET /rooms/${roomId}/members`);
    const membersRes = await request('GET', `/rooms/${roomId}/members`, undefined, token);
    console.log(`   Status: ${membersRes.status}`);
    console.log(`   Response: ${JSON.stringify(membersRes.data)}`);
    console.log(`   ${membersRes.status === 200 ? '✅' : '❌'}`);

    // 6. Get Room Messages
    console.log(`\n GET /rooms/${roomId}/messages`);
    const messagesRes = await request('GET', `/rooms/${roomId}/messages`, undefined, token);
    console.log(`   Status: ${messagesRes.status}`);
    console.log(`   Response: ${JSON.stringify(messagesRes.data)}`);
    console.log(`   ${messagesRes.status === 200 ? '✅' : '❌'}`);

    // 7. Leave Room
    console.log(`\n POST /rooms/${roomId}/leave`);
    const leaveRes = await request('POST', `/rooms/${roomId}/leave`, undefined, token);
    console.log(`   Status: ${leaveRes.status}`);
    console.log(`   Response: ${JSON.stringify(leaveRes.data)}`);
    console.log(`   ${leaveRes.status === 200 ? '✅' : '❌'}`);
  }

  // 8. Test auth required endpoints without token
  console.log('\n Testing protected routes without token');
  const noTokenRes = await request('GET', '/rooms');
  console.log(`   GET /rooms (no token): Status ${noTokenRes.status}`);
  console.log(`   Response: ${JSON.stringify(noTokenRes.data)}`);
  console.log(`   ${noTokenRes.status === 401 ? '✅ Correctly blocked' : '❌ Should be blocked'}`);

  // 9. Test invalid credentials
  console.log('\n Testing invalid login');
  const invalidLogin = await request('POST', '/auth/login', {
    email: 'invalid@test.com',
    password: 'wrongpass'
  });
  console.log(`   Status: ${invalidLogin.status}`);
  console.log(`   Response: ${JSON.stringify(invalidLogin.data)}`);
  console.log(`   ${invalidLogin.status === 401 ? '✅ Correctly rejected' : '❌ Should reject'}`);

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

runTests().catch(console.error);
