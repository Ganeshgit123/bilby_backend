const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);



//Schema
const questionsSchema = new Schema({
    fieldName: {  //Name of the field eg., brand, year
        type: String,
        default: ""
    },
    fieldType: {  //Type of the field e.g., dropdown, text, textarea,
        type: String,
        default: ""
    },
    fieldInputType: {
        type: String,
        default: ""
    },
    placeholder: {
        type: String,
        default: ""
    },
    fieldKey: {
        type: String,
        default: ""
    },
    isOn: {
        type: Boolean,
        default: true,
    }
},{ 
    timestamps: true            
})

const valueSet = new Schema({
    feldName: {
        type: String,
        default: ""
    },
    valueSet: {
        type: Array,
        default: []
    }
},{ 
    timestamps: true
})


const sub_category = new Schema({
    subCategoryName: {
        type: String,
        default: "",
    },
    questionId: {
        type: Array,
        default: [],
        ref: "questionsSchema"
    },
    valuesList: [valueSet],
    isOn: {
        type: Boolean,
        default: true
    }
},{ 
    timestamps: true
})

//Schema
const category = new Schema({
    categoryName: {
        type: String,
        default: ""
    },
    processName: {
        type: Array,
        default: []
    },
    subCategory: [sub_category],
    isOn: {
        type: Boolean,
        default: true
    }
},{ 
    timestamps: true
})

const Notification = new Schema({
    senderId: {
        type: Number,
        default: null
    },
    senderType: {
        type: String,
        default: null
    },
    reciverId: {
        type: Number,
        default: null
    },
    reciverType: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    message: {
        type: String,
        default: null
    },
    sendDate: {
        type: Date,
        default: new Date()
    },
    viewedDate: {
        type: Date,
        default: null
    },
    isViewed: {
        type: Boolean,
        default: false
    },
    refKey:{
        type: String,
        default: null
    },
    redirectUrl:{
        type: String,
        default: null
    }
},{ 
    timestamps: true
})


//Auto Increment counter
questionsSchema.plugin(autoIncrement.plugin, 'questionsSchema'); 
category.plugin(autoIncrement.plugin, 'category'); 


//Declaration
QUESTIONS = mongoose.model("questionsSchema", questionsSchema, "Questions");
CATEGORY = mongoose.model("category", category, "Category");
NOTIFICATION = mongoose.model("Notification", Notification, "Notification");



module.exports = {
    QUESTIONS,
    CATEGORY,
    NOTIFICATION
}