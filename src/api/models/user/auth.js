const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);


//Schema
const User_OTP = new Schema({
    mobile: {
        type: String,
    },
    email: {
        type: String
    },
    otp: {
        type: String,
    },
},{ 
    timestamps: true
})

//Schema
const educationDetails = new Schema({
    degree: {
        type: String,
        default: ""
    },
    yearOfCompletion: {
        type: Number,
        default: 0
    }
},{ 
    timestamps: true
})



//1. getMyProfile
const User = new Schema({
    mobile: {
        type: Number,
    },
    uID: {
        type: String,
        default: "",
        unique: true,
        immutable: true
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        default: 'user',
        immutable: true
    },
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    tagLine: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    portfolio: {
        type: Array,
        default: []
    },
    education: [
        educationDetails
    ],
    qualification: {
        type: String,
        default: ""
    },
    skill: {
        type: Array,
        default: []
    },
    certificate: {
        type: Array,
        default: []
    },
    FCMToken: {
        type: String,
        default: ""
    },
    isProfileUpdate: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    socketId: {
        type: String,
        default: ""
    }
},{ 
    timestamps: true
})


const User_History = new Schema({
    userId: {
        type: Number
    },
    mobile:{
        type: String
    },
    email:{
        type: String
    },
    token: {
        type: String
    },
    loginTime: {
        type: Date,
        default: new Date()
    },
    logoutTime: {
        type: Date
    },
    isLogout: {
        type: Boolean,
        default: false
    },
    deviceName: {
        type: String
    }
},{ 
    timestamps: true
})

const billingInfo = new Schema({
    userId: {
        type: Number
    },
    accountHolderName:{
        type: String,
        default: ""
    },
    accountNumber:{
        type: Number,
        default: 0
    },
    BSB:{
        type: Number,
        default: 0
    },
    address_line_1:{
        type: String,
        default: ""
    },
    address_line_2:{
        type: String,
        default: ""
    },
    suburb:{
        type: String,
        default: ""
    },
    postCode:{
        type: Number,
        default: 0
    },
    state:{
        type: String,
        default: ""
    },
    country:{
        type: String,
        default: ""
    }
},{ 
    timestamps: true
})


//Auto Increment counter
User.plugin(autoIncrement.plugin, 'User');



//Declaration
USEROTP = mongoose.model("User_OTP", User_OTP, "User_OTP");
USER = mongoose.model("User", User, "Users");
USERHISTORY = mongoose.model("User_History", User_History, "User_History");
BILLINGINFO = mongoose.model("BillingInfo", billingInfo, "BillingInfo");



module.exports = {
    BILLINGINFO,
    USEROTP,
    USER,
    USERHISTORY,
}