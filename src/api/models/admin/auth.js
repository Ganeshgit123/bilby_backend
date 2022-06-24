const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

//Schema
const adminAccount = new Schema({
    adminName: {
        type: String,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
    }
},{ 
    timestamps: true
})

const adminHistory = new Schema({
    adminName: {
        type: String,
    },
    adminId: {
        type: Number
    },
    token: {
        type: String,
    },
    role: {
        type: String
    },
    isLogout: {
        type: Boolean,
        default: false
    },
    loginTime: {
        type: Date,
        default: Date.now()
    },
    logoutTime: {
        type: Date,
    },
},{ 
    timestamps: true
})

const permissionShema = new Schema({
    area: String,
    access: Array
})


//Schema
const roleSchema = new Schema({
    role: {
        type: String,
    },
    permissions: [ permissionShema ]
},{ 
    timestamps: true
})


const adminUser = new Schema({
    adminName: String,
    adminType: String,
    password: String,
    roleId: Number,
    createdBy: Number,
    creatorType: String,
    isActive: {
        type: Boolean,
        default: true
    }
},{ 
    timestamps: true
})


//Auto Increment counter
adminAccount.plugin(autoIncrement.plugin, 'adminAccount'); 
adminHistory.plugin(autoIncrement.plugin, 'adminHistory'); 
roleSchema.plugin(autoIncrement.plugin, 'roleSchema');
adminUser.plugin(autoIncrement.plugin, 'adminUser');


//Declaration
ADMINACCOUNT = mongoose.model("adminAccount", adminAccount, "Admin")
ADMINHISTORY = mongoose.model("adminHistory", adminHistory, "AdminHistory")
ADMINROLES = mongoose.model("AdminRoles", roleSchema, "AdminRoles")
ADMINUSER = mongoose.model("AdminUser", adminUser, "AdminUser")



module.exports = {
    ADMINACCOUNT,
    ADMINHISTORY,
    ADMINROLES,
    ADMINUSER
}