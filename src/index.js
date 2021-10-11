const path = require('path');
const http = require('http');

const express = require('express');
const socketIO = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');



const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

const publicPath = path.join(__dirname + "/../",'public');
// console.log(`publicPath ----->> ${publicPath}`);

app.use(express.static(publicPath));
// let count = 0;
io.on('connection', (socket) => {


    // socket.broadcast.emit('message', generateMessage('A new user has joined!'));

    socket.on('join', ({username, room},callback) => {

        const {error, user} = addUser({
            id: socket.id,
            username: username,
            room: room
        });

        if(error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username.toUpperCase()} has joined`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();

        // socket.emit - emit to self client,
        // io.emit - emit to all connected client, 
        // socket.broadcast.emit - emit to all connected client except self

        // io.to.emit - emit to specific room
        // socket.broadcast.to.emit

    })

    socket.on('sendMessage', (message, callback) => {
        let filter = new Filter();
        if(filter.isProfane(message)){
            return callback("Profanity is now allowed!");
        }
        const user = getUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage(user.username,message));
            callback();
        }
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username.toUpperCase()} has left`));

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });

    socket.on('sendLocation', (location,callback) => {
        const user = getUser(socket.id);
        if(user){
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
            callback();    
        }
        
    })

});

server.listen(PORT, () => {
    console.log(`Server is listening on ---->> ${PORT}`);
})