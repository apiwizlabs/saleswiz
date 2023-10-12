const { ADMIN_ROLES, SALES_OWNER } = require("../helpers/roleGroups");
const {ApprovalModel} = require("../Models/Approval.models");
const {FormFieldsModel} = require("../Models/FormFields.model");
const UserModel = require("../Models/Users.model");

const getAllApprovals = async (req, res) => {
    try{
        // const {members, teamName} = req.body;
        const currentUserRole = res.locals.decodedToken.role;
        const currentUserId = res.locals.decodedToken.userId;
        if(SALES_OWNER.includes(currentUserRole)){
            const approvals = await ApprovalModel.find({salesOwnerId: currentUserId}).populate({model: FormFieldsModel, path: "linkedFieldId" }).populate({model: UserModel, path: "requestor", select: "firstName lastName profilePicture"});
            return res.status(200).json({
                success:true,
                data: approvals
            });
        }
        const approvals = await ApprovalModel.find({}).populate({model: FormFieldsModel, path: "linkedFieldId" }).populate({model: UserModel, path: "requestor", select: "firstName lastName profilePicture"});
        return res.status(200).json({
            success:true,
            data: approvals
        });


    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const updateApprovalById = async (req, res) => {
    try{
        const {status} = req.body;
        const {approvalId} = req.params;
        const currentUserRole = res.locals.decodedToken.role;
        const currentUserId = res.locals.decodedToken.userId;
        if(SALES_OWNER === currentUserRole){
            const approvals = await ApprovalModel.findByIdAndUpdate(approvalId, {status, salesOwnerId: currentUserId});
            return res.status(200).json({
                success:true,
                data: approvals,
            });
        }
        const approvals = await ApprovalModel.findByIdAndUpdate(approvalId, {status});
        return res.status(200).json({
            success:true,
            data: approvals,
        });
    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  module.exports = {updateApprovalById, getAllApprovals};