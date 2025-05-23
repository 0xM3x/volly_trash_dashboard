import { io } from 'socket.io-client';

const socket = io('http://localhost:8000'); // replace with backend server IP if needed

export default socket;
