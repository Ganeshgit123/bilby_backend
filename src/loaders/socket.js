const { CFAMAggrigate } = require('../api/dao');

const webSocket = (httpServer) => {
    const socketio = require('socket.io').listen(httpServer)
    const { chatController, getSocketOnline } = require("../api/controllers/socket");
    const auth = require("../api/middlewares/userAuth.js");


    
    socketio.on('connection', function (client) { 
        client.emit('connect', { test: 'test' }, function(data) {
            console.log("socket connected: "+data)
        });

        client.on('connect', function (data) {
            console.log('Connected...', client.id);
        })

        client.on('getOnline', function name(data) {
            console.log("Socket: getOnline"+ client.id)  
            data.soketId = client.id
            getSocketOnline(data, (result)=>{
                var emitter = 'get_online_' + data.id + '_ack'
                client.emit(emitter, result);
            })
        })

        client.on('sendmessage', function name(data) {
            console.log("Socket: sendmessage", data )
            chatController(data, async(result, user)=>{
                if(result?.error == false){
                    let letsAgg = [
                        {
                            $match: {
                            offerId: parseInt(result?.data?.offerId)
                            },
                        },
                        {
                            $lookup: {
                            from: "Users",
                            let: {
                                userId: "$senderId",
                            },
                            pipeline: [
                                {
                                $match: {
                                    $expr: {
                                    $eq: [ "$_id", "$$userId"  ],
                                    }
                                }
                                },
                                {
                                $project: {
                                    name: "$name",
                                    mobile: "$mobile",
                                    email: "$email",
                                    profileImage: "$profileImage",
                                    rating: "$rating",
                                }
                                }
                            ],
                            as: "posterDetails"
                            }
                        },
                        {
                            $unwind: "$posterDetails"
                        },
                        {
                            $project: {
                            // userDetails: "$posterDetails",
                            message: "$message",
                            senderId: "$senderId",
                            receiverId: "$receiverId",
                            contentType: "$contentType",
                            userType: "$userType",
                            date: {
                                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                            },
                            time: {
                                $dateToString: { format: "%H:%M", date: "$createdAt" }
                            },
                            isPoster:"$isPoster"
                            }
                        },
                        // {
                        //   $sort: { createdAt: -1 }
                        // }
                        ]
                    
                    let finded = await CFAMAggrigate(REPLAYS, 'aggregate', letsAgg, 'lang')

                    console.log("recievemessage", user.socketId)
                    client.to(user.socketId).emit('recievemessage', finded);
                }else{
                    client.to(user.socketId).emit('recievemessage', result);
                }
                


                
            })
        })

        client.on('disconnect', function () {
            console.log('Disconnected...', client.id);
        })
    
        client.on('error', function (err) {
            console.log('Error detected', client.id);
            console.log(err);
        })
    })

};

module.exports = webSocket