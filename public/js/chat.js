const socket = io();

// Elements

const messageForm = document.querySelector('#message-form');
const msgInput = document.querySelector('#message');
const sendBtn = document.querySelector('#send-message');
const messages = document.querySelector("#messages");

// QueryString 
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix: true});
console.log('username---->> ' + username);
console.log('room---->> ' + room);

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;



socket.on('message', (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
});


socket.on('locationMessage', (url) => {
    console.log(url);
    const html = Mustache.render(locationTemplate,{
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
});

socket.on('roomData', ({room,users}) =>{
    console.log('Sidebar Data---->>');
    console.log(room);
    console.log(users);

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector("#sidebar").innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e)=>{
    e.preventDefault();


    const message = msgInput.value.trim();
    if(message.length>0){
        sendBtn.setAttribute('disabled','disabled');

        socket.emit('sendMessage', message, (error)=>{
            if(error){
                return console.log(error);
            }
            // console.log('Message was delivered!');
            sendBtn.removeAttribute('disabled');
            msgInput.value = '';
            msgInput.focus();
        });
    }
});

const sendLocationBtn = document.querySelector('#send-location');
sendLocationBtn.addEventListener('click', () => {
    if('geolocation' in navigator) {
        /* geolocation is available */
        sendLocationBtn.setAttribute('disabled','disabled');
        navigator.geolocation.getCurrentPosition((position) => {
            // console.log(position.coords.latitude, position.coords.longitude);
            socket.emit('sendLocation', {
                latitude:position.coords.latitude,
                longitude:position.coords.longitude
            }, (error)=>{
                if(error){
                    return console.log(error);
                }
                sendLocationBtn.removeAttribute('disabled');
                console.log("Location shared!");
            });
        });

      } else {
        /* geolocation IS NOT available */
        return console.log('Geo-location is not available');
      }
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if(error){
        alert(error);
        location.href = '/';
        return console.log(error);
    }
    console.log('User Joined');
})