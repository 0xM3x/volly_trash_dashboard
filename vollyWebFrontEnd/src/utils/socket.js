import { io } from 'socket.io-client';

const user = JSON.parse(localStorage.getItem('user'));

const socket = io('http://localhost:8000', {
  auth: { user_id: user?.id },
  withCredentials: true,
});

socket.on('connect', () => {
  if (user?.id) {
    socket.emit('register', user.id);
  }
});

export default socket;
