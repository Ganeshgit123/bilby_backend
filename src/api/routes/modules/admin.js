const express = require("express");
const admin = express.Router();
const { registerAdmin, loginAdmin, logoutAdmin, logoutAllSession, getCreatedAdminRoleById, createRole, editRole, createAdminUser, editAdminUser, getCreatedAdminRole, getAllAdminUser, createCategory, editCategory, deleteCategory, createSubCategory, editSubCategory, deleteSubCategory, getAllCategory_Subcategory, updateCatStatus, createQuestion, editQuestionField, getAllQuestionField, createQuestionField, addQuestionToCategory, deleteSubcategory, getAllAddedQuestionById, getUserList, getActivePost, getInactivePost, getActivePostByUserId, getInactivePostByUserId, getActivetask, getActiveTaskByUserId, getInactiveTaskByUserId, getInactiveTask, createSellerSubscription, getAllSellerSubscription, editSellerSubscription, statusUpdateSellerSubscription, deleteSellerSubscription, createTaskerSubscription, editTaskerSubscriotion, getAllTaskersubscription, deleteTaskerSubscription, statusUpdateTaskerSubscription, postFAQ, getFAQ, editFAQ, deleteFAQ, getAllCoupon, deleteOneCoupon, editCoupon, addNewCoupon, getAdminNotifications, updateNotificationStatus, editAddedQuestions, createBadges, editBadges, getAddedBadges, deleteBadges, updateBadgeStatus, getBadgeRequestByuserId, updateStatusForRequest, getTermsAndConditons, getPrivacy, getAboutUs, addTermsAndConditons, editTermsAndConditons, addPrivacy, editPrivacy, addAboutUs, editAboutUs } = require("../../controllers/admin");
const auth = require("../../middlewares/adminAuth.js");
const allow = require("../../middlewares/adminPermission.js");



//POST
admin.route("/registerAdmin").post(registerAdmin);
admin.route("/loginAdmin").post(loginAdmin);
admin.route("/logoutAdmin").post(auth, logoutAdmin);
admin.route("/logoutAllSession").post(logoutAllSession);
admin.route("/createRole").post(auth, allow, createRole);
admin.route("/editRole").post(auth, allow, editRole);
admin.route("/createAdminUser").post(auth, allow, createAdminUser);
admin.route("/editAdminUser").post(auth, allow, editAdminUser);
admin.route("/createCategory").post(auth, allow, createCategory);
admin.route("/editCategory").post(auth, allow, editCategory);
admin.route("/deleteCategory").post(auth, allow, deleteCategory);
admin.route("/deleteSubcategory").post(auth, allow, deleteSubcategory);
admin.route("/updateCatStatus").post(auth, allow, updateCatStatus);
admin.route("/createQuestionField").post(auth, allow, createQuestionField);
admin.route("/editQuestionField").post(auth, allow, editQuestionField);
admin.route("/addQuestionToCategory").post(auth, allow, addQuestionToCategory);
admin.route("/editAddedQuestions").post(auth, allow, editAddedQuestions);
admin.route("/createSellerSubscription").post(auth, allow, createSellerSubscription);
admin.route("/editSellerSubscription").post(auth, allow, editSellerSubscription);
admin.route("/statusUpdateSellerSubscription").post(auth, allow, statusUpdateSellerSubscription);
admin.route("/deleteSellerSubscription").post(auth, allow, deleteSellerSubscription);
admin.route("/createTaskerSubscription").post(auth, allow, createTaskerSubscription);
admin.route("/editTaskerSubscriotion").post(auth, allow, editTaskerSubscriotion);
admin.route("/statusUpdateTaskerSubscription").post(auth, allow, statusUpdateTaskerSubscription);
admin.route("/deleteTaskerSubscription").post(auth, allow, deleteTaskerSubscription);
admin.route("/postFAQ").post(auth, allow, postFAQ);
admin.route("/editFAQ").post(auth, allow, editFAQ);
admin.route("/deleteFAQ").post(auth, allow, deleteFAQ);
admin.route("/addNewCoupon").post(auth, allow, addNewCoupon);
admin.route("/editCoupon").post(auth, allow, editCoupon);
admin.route("/deleteOneCoupon").post(auth, allow, deleteOneCoupon);
admin.route("/getAdminNotification").post(auth, allow, getAdminNotifications);
admin.route("/updateNotificationStatus").post(auth, allow, updateNotificationStatus);
admin.route("/createBadges").post(auth, allow, createBadges);
admin.route("/editBadges").post(auth, allow, editBadges);
admin.route("/deleteBadges").post(auth, allow, deleteBadges);
admin.route("/updateBadgeStatus").post(auth, allow, updateBadgeStatus);
admin.route("/updateStatusForRequest").post(auth, allow, updateStatusForRequest);

admin.route("/addTermsAndConditons").post(auth, allow, addTermsAndConditons);
admin.route("/editTermsAndConditons").post(auth, allow, editTermsAndConditons);

admin.route("/addPrivacy").post(auth, allow, addPrivacy);
admin.route("/editPrivacy").post(auth, allow, editPrivacy);

admin.route("/addAboutUs").post(auth, allow, addAboutUs);
admin.route("/editAboutUs").post(auth, allow, editAboutUs);

//GET
admin.route("/getAllCategory_Subcategory").get(auth, allow, getAllCategory_Subcategory);
admin.route("/getCreatedAdminRole").get(auth, allow, getCreatedAdminRole);
admin.route("/getAllAdminUser").get(auth, allow, getAllAdminUser);
admin.route("/getCreatedAdminRoleById").get(auth, allow, getCreatedAdminRoleById);
admin.route("/getAllQuestionField").get(auth, allow, getAllQuestionField);
admin.route("/getAllAddedQuestionById").get(auth, allow, getAllAddedQuestionById);
admin.route("/getUserList").get(auth, allow, getUserList);
admin.route("/getActivePost").get(auth, allow, getActivePost);
admin.route("/getInactivePost").get(auth, allow, getInactivePost);
admin.route("/getActivePostByUserId").get(auth, allow, getActivePostByUserId);
admin.route("/getInactivePostByUserId").get(auth, allow, getInactivePostByUserId);
admin.route("/getActivetask").get(auth, allow, getActivetask);
admin.route("/getActiveTaskByUserId").get(auth, allow, getActiveTaskByUserId);
admin.route("/getInactiveTask").get(auth, allow, getInactiveTask);
admin.route("/getInactiveTaskByUserId").get(auth, allow, getInactiveTaskByUserId);
admin.route("/getAllSellerSubscription").get(auth, allow, getAllSellerSubscription);
admin.route("/getAllTaskersubscription").get(auth, allow, getAllTaskersubscription);
admin.route("/getFAQ").get(auth, allow, getFAQ);
admin.route("/getAllCoupon").get(auth, allow, getAllCoupon);
admin.route("/getAddedBadges").get(auth, allow, getAddedBadges);
admin.route("/getBadgeRequestByuserId").get(auth, allow, getBadgeRequestByuserId);
admin.route("/getTermsAndConditons").get(auth, allow, getTermsAndConditons);
admin.route("/getPrivacy").get(auth, allow, getPrivacy);
admin.route("/getAboutUs").get(auth, allow, getAboutUs);


module.exports = admin;
