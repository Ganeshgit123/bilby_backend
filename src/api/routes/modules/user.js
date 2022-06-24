const express = require("express");
const { getAllAddedQuestionById } = require("../../controllers/admin.js");
const { 
        validateUser, 
        sendOTPtoMobile, 
        verifyOTP, 
        loginUser, 
        getAllCategory_Subcategory, 
        getMyProfile, 
        updateUserProfile, 
        postSellingProduct, 
        deleteSellingProduct, 
        getInactivePost, 
        getActivePost, 
        setPostStatus, 
        postTask, 
        getPostedTasks, 
        getTaskList, 
        setTaskStatus, 
        deleteTask, 
        getSellerSubscription,
        getTaskerSubscription,
        getUserFAQ,
        verifyUser,
        getUserNotification,
        transfer,
        getWalletHistory,
        getAllTaskCategory,
        getAllCategoryWiseUser,
        getAllUserByCategory,
        putImageToS3,
        getTaskListById,
        getCanceledTasks,
        getCompletedTasks,
        getOngoingTasks,
        cancelTask,
        completeTask,
        buyYourSubscription_tasker,
        purchasedSubscription,
        addBillingInfo,
        getYourBillingInfo,
        editBillingInfo,
        postOffersToTask,
        getYourPostedOffer,
        acceptOffer,
        getNewAppointments,
        startWorkForOffer,
        getCompletedAppointment,
        getCanceledAppointment,
        getYourBillingHistory,
        paymentUpdateForOffer,
        updateBillingStatus,
        editPost,
        postReview,
        getYourReview,
        getReviewByTaskId,
        getReviewByOfferId,
        getProfileById,
        getAllTaskByStatus,
        getAllOffersByStatus,
        postReplay,
        getReplysByOfferId,
        postQuestions,
        getAllTaskByCategoryId,
        getBadgesList,
        requestForBadges,
        postReply,
        getQuestionsByTaskId,
        postReplayForQuestion,
        getAnswersByQuestionId,
        completedTheOffer,
        getTermsAndConditons,
        getPrivacy,
        getAboutUs,
        getPostersReview,
        getTaskersReview
    } = require("../../controllers/user.js");
const users = express.Router();
const auth = require("../../middlewares/userAuth.js");
const allow = require("../../middlewares/adminPermission.js");
const { upload } = require("../../middlewares/multer");
const { paymentSheet } = require("../../controllers/payment.js");



//post
users.route("/sendOTPtoMobile").post(validateUser, sendOTPtoMobile);
users.route("/verifyOTP").post(verifyOTP);
users.route("/loginUser").post(loginUser);
users.route("/updateUserProfile").post(auth,updateUserProfile);
users.route("/postSellingProduct").post(postSellingProduct);
users.route("/deleteSellingProduct").post(deleteSellingProduct);
users.route("/setPostStatus").post(auth, setPostStatus);
users.route("/postTask").post(auth, postTask);
users.route("/setTaskStatus").post(auth, setTaskStatus);
users.route("/deleteTask").post(deleteTask);
users.route("/verifyUser").post(verifyUser);
users.route("/getUserNotification").get(auth, getUserNotification);
users.route("/getWalletHistory").get(auth, getWalletHistory);
users.route("/transfer").post(auth, transfer);
users.route("/putImageToS3").post(upload.single("image"), putImageToS3);
users.route("/cancelTask").post(auth, cancelTask);
users.route("/completeTask").post(auth, completeTask);
users.route("/buyYourSubscription_tasker").post(auth, buyYourSubscription_tasker);
users.route("/addBillingInfo").post(auth, addBillingInfo);
users.route("/editBillingInfo").post(auth, editBillingInfo);
users.route("/postOffersToTask").post(auth, postOffersToTask);
users.route("/acceptOffer").post(auth, acceptOffer);
users.route("/startWorkForOffer").post(auth, startWorkForOffer);
users.route("/paymentUpdateForOffer").post(auth, paymentUpdateForOffer);
users.route("/updateBillingStatus").post(auth, updateBillingStatus);
users.route("/editPost").post(auth, editPost);
users.route("/postReview").post(auth, postReview);
users.route("/postReply").post(auth, postReply);
users.route("/postQuestions").post(auth, postQuestions);
users.route("/requestForBadges").post(auth, requestForBadges);
users.route("/postReplayForQuestion").post(auth, postReplayForQuestion);
users.route("/completedTheOffer").post(auth, completedTheOffer);
users.route("/payment-sheet").post(auth, paymentSheet);



users.route("/getAllCategory_Subcategory").get(auth, getAllCategory_Subcategory); //
users.route("/getAllTaskCategory").get( getAllTaskCategory);
users.route("/getMyProfile").get(auth, getMyProfile);//
users.route("/getQustions").get(getAllAddedQuestionById);
users.route("/getActivePost").get(auth, getActivePost);//
users.route("/getInactivePost").get(auth, getInactivePost);
users.route("/getPostedTasks").get(auth, getPostedTasks);
users.route("/getTaskList").get(auth, getTaskList);
users.route("/getTaskListById").get(auth, getTaskListById);
users.route("/getSellerSubscription").get(auth, getSellerSubscription);
users.route("/getTaskerSubscription").get(auth, getTaskerSubscription);
users.route("/getUserFAQ").get(getUserFAQ);
users.route("/getAllCategoryWiseUser").get(getAllCategoryWiseUser);
users.route("/getAllUserByCategory").get(getAllUserByCategory);
users.route("/getCanceledTasks").get(auth, getCanceledTasks);
users.route("/getCompletedTasks").get(auth, getCompletedTasks);
users.route("/getOngoingTasks").get(auth, getOngoingTasks);
users.route("/purchasedSubscription").get(auth, purchasedSubscription);
users.route("/getYourBillingInfo").get(auth, getYourBillingInfo);
users.route("/getYourPostedOffer").get(auth, getYourPostedOffer);
users.route("/getNewAppointments").get(auth, getNewAppointments);
users.route("/getCompletedAppointment").get(auth, getCompletedAppointment);
users.route("/getCanceledAppointment").get(auth, getCanceledAppointment);
users.route("/getYourBillingHistory").get(auth, getYourBillingHistory);
users.route("/getYourReview").get(auth, getYourReview);
users.route("/getReviewByOfferId").get(auth, getReviewByOfferId);
users.route("/getReviewByTaskId").get(auth, getReviewByTaskId);
users.route("/getProfileById").get(auth, getProfileById);
users.route("/getAllTaskByStatus").get(auth, getAllTaskByStatus);
users.route("/getAllOffersByStatus").get(auth, getAllOffersByStatus);
users.route("/getReplysByOfferId").get(auth, getReplysByOfferId);
users.route("/getAllTaskByCategoryId").get(auth, getAllTaskByCategoryId);
users.route("/getBadgesList").get(auth, getBadgesList);
users.route("/getQuestionsByTaskId").get(auth, getQuestionsByTaskId);
users.route("/getAnswersByQuestionId").get(auth, getAnswersByQuestionId);
users.route("/getTermsAndConditons").get(getTermsAndConditons);
users.route("/getPrivacy").get(getPrivacy);
users.route("/getAboutUs").get(getAboutUs);
users.route("/getPostersReview").get(auth, getPostersReview);
users.route("/getTaskersReview").get(auth, getTaskersReview);

module.exports = users;
