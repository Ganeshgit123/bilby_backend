const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

//Schema
const pointSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // arrays of numbers
      required: true
    }
});


//Schema
const taskCollection = new Schema({
    userId: {
        type: Number,
    },
    title: {
        type: String,
        default: ""
    },
    taskType: {
        type: String,
        default: ""
    },
    amount: {
        type: mongoose.Types.Decimal128,
        default: 0.00
    },
    amountUnit: {
        type: String,
        default: "per Service"
    },
    images: {
        type: Array,
        default: []
    },
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now()
    },
    time: {
        type: String,
        default: ""
    },
    location: {
        type: pointSchema
    },
    isActive: {
        type: Boolean,
        default: true
    },
    offersCount:{
        type: Number,
        default: 0
    },
    isCanceled: {
        type: Boolean,
        default: false
    },
    canceledTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        default: "open" //open, assigned, ongoing, completed, canceled
    },
    isLive: {
        type: Boolean,
        default: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedTime: {
        type: Date,
        default: null
    },
    isWorkStarted: {
        type: Boolean,
        default: false
    },
    workStartedTime: {
        type: Date,
        default: null
    },
    assignedOfferId: {
        type: Number,
        default: null
    },
    isAssigned: {
        type: Boolean,
        default: false
    },
    taskerCompletion: {
        type: Boolean,
        default: false,
    },
    tskCompletionDate: {
        type: Date,
        default: null
    }
},{  
    timestamps: true
})

const listAdds = new Schema({
    addsCount: {
        type: Number,
        default: 0
    },
    price: {
        type:Number,
        default: 0
    },
    validDayCount: { 
        type: Number, 
        default: 0  //days count
    }
},{  
    timestamps: true
})


const subscription_tasker = new Schema({
    title: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        default: 0
    },
    validity: {
        type: Number, 
        default: 0  //in days
    },
    commissionPercent: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    benefits: {
        type: String,
        default: ""
    },
    validTaskCount: {
        type: Number,
        default: 0
    },
    homePageAdd: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{  
    timestamps: true
})

const subscription_seller = new Schema({
    title: {
        type: String,
        default: ""
    },
    addsList: [ listAdds ],
    description: {
        type: String,
        default: ""
    },
    benefits: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{  
    timestamps: true
})

const Purchages_Subscription = new Schema({
    userId: {
        type: Number,
        default: null
    },
    subscriptionId: {
        type: Number,
        default: null
    },
    subscriptionType: {
        type: String, 
        default: ""  //seller or tasker
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    //ifTasker
    startDate: {
        type: Date,
        default: Date.now()
    },
    endDate: {
        type: Date,
        default: null
    },
    commissionPercent: {
        type: Number,
        default: 0
    },
    taskCount: {
        type: Number,
        default: 0
    },
    usedTaskCount: {
        type: Number,
        default: 0
    },
    allowHomePage: {
        type: Boolean,
        default: false
    },
    //ifSeller
},{  
    timestamps: true
})

const Offers = new Schema({
    userId: {
        type: Number,
        default: null
    },
    taskId: {
        type: Number,
        default: null
    },
    budget: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "pending"  //pending, accepted, declined
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    acceptedTime: {
        type: Date,
        default: null
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidTime: {
        type: Date,
        default: null
    },
    paymentId: {
        type: Number,
        default: null
    },
    isCanceled: {
        type: Boolean,
        default: false
    },
    canceledTime: {
        type: Date,
        default: null
    },
    replaysCount: {
        type: Number,
        default: 0
    }
},{  
    timestamps: true
})

const Ratings = new Schema({
    postedBy: {
        type: Number,
        default: null
    },
    userId: {
        type: Number,
        default: null
    },
    taskId:{
        type: Number,
        default: null
    },
    offerId: {
        type: Number,
        default: null
    },
    rating: {
        type: Number,
        default: 0
    },
    images: {
        type: Array,
        default: []
    },
    review: {
        type: String,
        default: ""
    },
    as: {
        type: String,
        default: ""
    }
},{  
    timestamps: true
})


const Payment = new Schema({
    userId: {
        type: Number,
        default: null
    },
    taskerId: {
        type: Number,
        default: null
    },
    taskId: {
        type: Number,
        default: null
    },
    taskAmount: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    couponId: {
        type: Number,
        default: null
    },
    discount: {
        type: Number,
        default: null
    },
    total: {
        type: Number,
        default: 0
    },
    isPayed: {
        type: Boolean,
        default: false
    },
    payedDate: {
        type: Date,
        default: null
    },
    paymentReferanceId: {
        type: String,
        default:""
    }
},{  
    timestamps: true
})


const Replays = new Schema({
    senderId: {
        type: Number,
        default: null
    },
    receiverId: {
        type: Number,
        default: null
    },
    offerId: {
        type: Number,
        default: null
    },
    taskId: {
        type: Number,
        default: null
    },
    message: {
        type: String,
        default: ""
    },
    contentType: {  
        type:  String,
        default: "", 
    },
    userType: {
        type: String,
        default: ""
    },
},{  
    timestamps: true
})


const task_Questions = new Schema({
    userId: {
        type: Number,
        default: null
    },
    taskId: {
        type: Number,
        default: null
    },
    question: {
        type: String,
        default: ""
    },
    questionType: {
        type: String,
        default: "string"
    },
    answersCount: {
        type: Number,
        default: 0
    }
},{  
    timestamps: true
})


const Answers = new Schema({
    userId: {
        type: Number,
        default: null
    },
    taskId: {
        type: Number,
        default: null
    },
    questionId: {
        type: Number,
        default: null
    },
    answer: {
        type: String,
        default: ""
    },
    answerType: {
        type: String,
        default: "string"
    }
},{  
    timestamps: true
})


//index
taskCollection.index({location: '2dsphere'});


//Auto Increment counter
taskCollection.plugin(autoIncrement.plugin, 'taskCollection');
subscription_tasker.plugin(autoIncrement.plugin, 'subscription_tasker');
subscription_seller.plugin(autoIncrement.plugin, 'subscription_seller');
Purchages_Subscription.plugin(autoIncrement.plugin, 'Purchages_Subscription');
Offers.plugin(autoIncrement.plugin, 'Offers');
Ratings.plugin(autoIncrement.plugin, 'Ratings');
Payment.plugin(autoIncrement.plugin, 'Payment');
Replays.plugin(autoIncrement.plugin, 'Replays');
task_Questions.plugin(autoIncrement.plugin, 'task_Questions');
Answers.plugin(autoIncrement.plugin, 'Answers');


//Declaration
SUBSCRIPTION_SELLER = mongoose.model("subscription_seller", subscription_seller, "Subscription_Seller");
SUBSCRIPTION_TASKER = mongoose.model("subscription_tasker", subscription_tasker, "Subscription_Tasker");
TASKS = mongoose.model("taskCollection", taskCollection, "Tasks");

PURCHASEDSUBSCRIPTION = mongoose.model("Purchages_Subscription", Purchages_Subscription, "Purchages_Subscription");
OFFERS = mongoose.model("Offers", Offers, "Offers");

REVIEWS = mongoose.model("Ratings", Ratings, "Ratings");
PAYMENT = mongoose.model("Payment", Payment, "Payment");
REPLAYS = mongoose.model("Replays", Replays, "Replays");
TASKQUESTIONS = mongoose.model("Task_Questions", task_Questions, "Task_Questions");
ANSWERS = mongoose.model("Answers", Answers, "Answers");


module.exports = {
    ANSWERS,
    TASKS,
    SUBSCRIPTION_SELLER,
    SUBSCRIPTION_TASKER,
    PURCHASEDSUBSCRIPTION,
    OFFERS,
    PAYMENT,
    REPLAYS,
    TASKQUESTIONS
}