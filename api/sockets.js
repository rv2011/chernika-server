var io = require('socket.io');
var AuthPolicy = require('./policies/AuthPolicy.js');
var restify = require('restify');
var mongoose = require('mongoose');

module.exports = {
    init: function(server) {
        io = io(server);

        ioFilterHelper(io, socketToRestifyReqPatcher);
        ioFilterHelper(io, restify.fullResponse());
        ioFilterHelper(io, restify.bodyParser());
        ioFilterHelper(io, restify.queryParser());
        ioFilterHelper(io, AuthPolicy.checkSession);
        
        io.on('connection', function(socket) {
            socket.userId = socket.request.params.userId;
//            socket.userId = '554b7aff499b7a6935ae4564';
            joinChatRooms(socket);
            
            socket.on('chats_info', function () {
                ChatService.getChatsInfo(socket.userId)
                    .then(function (chatsInfo) {
                        socket.emit('chats_info', chatsInfo);
                    })
            });

            socket.on('new_message', function(message) {
                var messageDocument = new Message(message);
                ChatService.addMessage(messageDocument).then(function () {
                    io.to('chat_' + message.chat).emit('new_message', message);
                });
            });

            socket.on('messages_during_interval', function (req) {
                var until = req.until ? new Date(req.until) : new Date();
                var from = new Date(req.from);
                var chatId = mongoose.Types.ObjectId(req.chat);
                ChatService.getMessagesDuringInterval(chatId, from, until)
                    .then(function(messages) {
                       socket.emit('messages_during_interval', messages);
                    });
            });
        });
    }
};


function ioFilterHelper(io, filter) {
    if (filter.constructor === Array) {
        filter.forEach(function(filterItem) {
            ioFilterHelper(io, filterItem);
        })
    } else {
        io.use(function(socket, next) {
            filter(socket.request, socket.request.res, next)
        });
    }
}

function socketToRestifyReqPatcher(req, res, next) {
    req.params = req.params || {};
    return next();
}

function joinChatRooms(socket) {
    ChatService.findChats(socket.userId)
        .then(function (chats) {
            chats.forEach(function (chat) {
                socket.join('chat_' + chat.id);
            });
        });
}