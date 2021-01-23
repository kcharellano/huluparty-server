const io = require("socket.io-client");
const HOST_ADDR = 'http://localhost:3000';
const SOCKET = io(HOST_ADDR);
var myUserId;

SOCKET.on('newUser', (data) => {
    myUserId = data;
    console.log(`Returned Id is: ${myUserId}`);
});