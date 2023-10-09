const express = require('express')
const app = express()
const http = require('http')
const cors = require('cors')
const {Server} = require('socket.io')
const axios = require("axios")
app.use(cors())

app.get('/',(req,res)=>{
    res.send("Server is working fine..👍")
})
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin:"*",
        methods: ["GET","POST"]
    }
})

const users = []
const Rooms = [];
const getRoom = async () => {
    const url = "https://chat-app-992be-default-rtdb.firebaseio.com/"
    const {data} = await axios.get(`${url}room.json`)
    return data
}

const addRoom = async (user,room,photoURL) => {
    const url = "https://chat-app-992be-default-rtdb.firebaseio.com/"
    const res = await axios.post(`${url}room.json`,{user,room,photoURL})
    const rooms = getRoom()
    return rooms
}

const deleteRoom = async() => {
    const url = "https://chat-app-992be-default-rtdb.firebaseio.com/"
    axios.delete(`${url}room.json`)
}

const getChat = async () => {
    const url = "https://chat-app-992be-default-rtdb.firebaseio.com/"
    const {data} = await axios.get(`${url}chat.json`)
    const keys = Object.keys(data)
    const chats = keys.map(key => {
        const value = data[key]
        return value
    })
    return chats
}

const addChat= async (data,user,from,room) => {
    const url = "https://chat-app-992be-default-rtdb.firebaseio.com/"
    const res = await axios.post(`${url}chat.json`,{data,user,from,room})
}

io.on("connection",socket => {

    socket.on("new-user",async (user,room,photoURL) => {
        socket.join(room)
        users[socket.id] = user
        const rooms = await addRoom(user,room,photoURL)
        socket.broadcast.emit("user-joined",user)
        socket.broadcast.emit("rooms",rooms)
        socket.emit("rooms",rooms)
    })
    socket.on("get-chat",async(room) => {
        const chats = await getChat()
        socket.broadcast.to(room).emit("set-message",chats)
        socket.emit("set-message",chats)
    })
    socket.on("send-message",async(data,photoURL,user,from,room) =>{
        const res = await addChat(data,user,from,room)
        socket.broadcast.to(room).emit("receive-message",data,user)
        socket.broadcast.to(room).emit("notify-message",data,photoURL,user)
        socket.join(user)
    })

    socket.on("get-peer",(data) => {
        // console.log(data)
        socket.broadcast.to(data.room).emit("send-peer",(data.from))
    })

    socket.on("remote-peer",(data) => {
        // console.log(data)
        socket.broadcast.to(data.from).emit("receive-peerId",data.peerId)
    })

    socket.on("disconnect",()=>{
        if(users[socket.id] != null)
        {
            socket.broadcast.emit("user-left",users[socket.id])
        }
        // deleteRoom()
        console.log(`user disconnected`)
    })
})

const port = process.env.PORT || 5000
server.listen(port)