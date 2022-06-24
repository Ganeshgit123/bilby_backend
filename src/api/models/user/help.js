const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

//Schema
const helpDoc = new mongoose.Schema({
    question: {
        type: String,
        default: ""
    },
    answer: {
        type: String,
        default: ""
    },
    isOn: {
        type: Boolean,
        default: true
    }
});

const Coupon = new Schema({
    title: {
        type: String,
    },
    description: {
        type: String
    },
    validFrom:{
        type: Date,
        default: new Date()
    },
    validTo: {
        type: Date,
    },
    code: {
        type: String,
        unique: true
    },
    discount: {
        type: Number
    },
    upToAmount: {
        type: Number
    },
    minValueTill: {
        type: Number
    },
    useCount: {
        type: Number
    },
    isOn: {
        type: Boolean,
        default: true
    },
    isSpecial:{
        type: Boolean,
        default: false
    },
    specialUserId: {
        type: Array,
        default: null,
        ref: 'Users'
    }
},{ 
    timestamps: true
})



const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            required: true,
            immutable: true,
            unique: true
        },
        balance: {
            type: mongoose.Decimal128,
            required: true,
            default: 0.00
        },

    },
    { timestamps: true }
);

//transaction
const transactionSchema = new mongoose.Schema(
    {
      trnxType: {
        type: String,
        required: true,
        enum: ['CR', 'DR']
      },
      purpose:{
        type: String,
        enum : ['deposit', 'transfer', 'reversal', 'withdrawal'],
        required: true
      },
      amount: {
        type: mongoose.Decimal128,
        required: true,
        default: 0.00
      },
      userId: {
        type: Number,
      },
      walletId: {
        type: Number,
        ref: 'Wallet'
      },
      reference: { type: String, required: true },
      balanceBefore: {
        type: mongoose.Decimal128,
        required: true,
      },
      balanceAfter: {
        type: mongoose.Decimal128,
        required: true,
      },
      summary: { type: String, required: true },
      trnxSummary:{ type: String, required: true }
    },
    { timestamps: true }
  );


const Badges = new Schema({
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    iconImage: {
        type: String,
        default: ""
    },
    isOn: {
        type: Boolean,
        default: true
    },
    applyedUser: {
        type: Array,
        default: []
    },
    approvedUser:{
        type: Array,
        default:[]
    },
    rejectedUser:{
        type: Array,
        default:[]
    }
},{ 
    timestamps: true
})

//Auto Increment counter
helpDoc.plugin(autoIncrement.plugin, 'helpDoc');
Coupon.plugin(autoIncrement.plugin, 'Coupon');
Badges.plugin(autoIncrement.plugin, 'Badges');
walletSchema.plugin(autoIncrement.plugin, 'walletSchema');
transactionSchema.plugin(autoIncrement.plugin, 'transactionSchema');



//Declaration
FAQ = mongoose.model("help", helpDoc, "FAQ");
COUPON = mongoose.model("coupon", Coupon, "Coupon");
BADGES = mongoose.model("Badges", Badges, "Badges");
WALLET = mongoose.model("walletSchema", walletSchema, "Wallet");
TRRANSACTIONS = mongoose.model("transactionSchema", transactionSchema, "Transaction_Wallet");



module.exports = {
    BADGES,
    FAQ,
    COUPON,
    WALLET,
    TRRANSACTIONS
}