const UserModel = require("../Models/Users.model");
const DealModel = require("../Models/Deals.model");
const { FormFieldsModel } = require("../Models/FormFields.model");
const { CustomerModel } = require("../Models/Customers.model");
const TeamModel = require("../Models/Teams.model");
const ActivityModel = require("../Models/Activities.model");
const {ADMIN_ROLES, TEAM_LEADS} = require("../helpers/roleGroups");
const {ApprovalModel} = require("../Models/Approval.models");

const getDealsForPipeline = async (req, res) => {
    try{
        const currentUserId = res.locals.decodedToken.userId;      
        const currentUserRole = res.locals.decodedToken.role;      
        const pipelineData = await UserModel.findById(currentUserId)
        .select('pipelineSequence firstName lastName role')
        .populate({path: 'pipelineSequence', 
            model: DealModel, 
            populate: [
                {
                    path: "activities", model: ActivityModel
                }, 
                {
                    path: 'linkedCustomer', model: CustomerModel, 
                    populate: {path: 'linkedTeam', model: TeamModel, select: 'members teamName', 
                    populate: {path: "members", model: UserModel, select: "firstName lastName profilePicture role"}} 
                },
                {
                    path: 'userValues.templateFieldId',
                    model: FormFieldsModel
                },
                {
                    path: 'userValues.approvalFieldId',
                    model: ApprovalModel
                }
            ]
        })

        const dealStagesList = pipelineData?.pipelineSequence ? [...pipelineData?.pipelineSequence.keys()] : [];

        for(let i = 0; i < dealStagesList.length; i++){
            const currentDealStage = dealStagesList[i];
            const dealStageList = pipelineData.pipelineSequence.get(currentDealStage);
            for(let j = 0; j < dealStageList.length; j++){
                const currentDeal = dealStageList[j];
                if(currentDeal.isDeleted){
                    dealStageList.splice(j,1);
                    continue;
                }

                let filteredDealValues = []

                if([...ADMIN_ROLES, ...TEAM_LEADS].includes(currentUserRole)){
                    filteredDealValues = currentDeal.userValues.filter(userField => {
                            if(userField.templateFieldId.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                            return userField.templateFieldId.readAccessRoles.includes(currentUserRole);
                        } 
                        return true;
                    });
                }else{
                    for(let i = 0; i < currentDeal.userValues.length; i++){
                        const userValue = currentDeal.userValues[i]
                        if(userValue.templateFieldId.needsApproval ){
                            if(!userValue.fieldValue){
                                continue;
                            }
                            const approval = await ApprovalModel.findById(userValue.approvalFieldId);
                            if(approval?.status === "APPROVED"){
                                if(userValue.templateFieldId.isSensitive){
                                    if(userValue.templateFieldId.readAccessRoles.includes(currentUserRole)){
                                        filteredDealValues.push(userValue);
                                        continue;
                                    }
                                    continue;
                                }
                                filteredDealValues.push(userValue);
                                continue;
                            }
                            continue;
                        }
                        if(userValue.templateFieldId.isSensitive){
                            if(userValue.templateFieldId.readAccessRoles.includes(currentUserRole)){
                                filteredDealValues.push(userValue);
                                continue;
                            }
                            continue;
                        } 
                        filteredDealValues.push(userValue);
                        continue;
                    }
                }
                dealStageList[j].userValues = filteredDealValues;
            }
        }

        return res.status(200).json({
            success: true,
            data: pipelineData,
        })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
    }
}

const updatePipelineDealStage = async (req, res) => {
    try{
        const currentUserId = res.locals.decodedToken.userId;      
        const currentUserRole = res.locals.decodedToken.role; 
        const { firstColumnData, firstColumnStatus, secondColumnData, secondColumnStatus, dealId }= req.body;
        const currentUser = await UserModel.findById(currentUserId);
        if(secondColumnStatus && secondColumnData && firstColumnStatus){

            const foundDeal = await DealModel.findById(dealId).populate({path: 'userValues.templateFieldId', model: FormFieldsModel}).populate({path: "linkedCustomer", model: CustomerModel, 
            populate: {path: "linkedTeam", model: TeamModel, populate: {path: "members", model: UserModel, select: "role"}}});
            const stageField = foundDeal.userValues.find(userValue => userValue.labelName === "Select Stage");
            if(stageField.templateFieldId.isSensitive && !stageField.writeAccessRoles.includes(currentUserRole)){
                return res.status(403).json({
                    success: false,
                    message: "User does not have access to edit the deal stage"
                });
            }
            if(stageField.fieldValue === secondColumnStatus){
                currentUser.pipelineSequence.set(firstColumnStatus, firstColumnData);
                const savedUserSequence = await currentUser.save();
                return res.status(200).json({
                    success: true,
                    data: savedUserSequence,
                })
                // console.log(firstColumnStatus, secondColumnData, secondColumnStatus, firstColumnData, "WHAT 123")
                // return res.status(400).json({
                //     success: false,
                //     message: "Stage needs to be different"
                // });
            }
            const updatedUserValues = foundDeal.userValues.map((userValue)=>{
                if(userValue.labelName === "Select Stage"){
                    userValue.fieldValue = secondColumnStatus;
                }
                return userValue;
            })

            const pipelineObject = {};
            pipelineObject[`pipelineSequence.${secondColumnStatus}`] = dealId; 
            const pullObject = {};  
            pullObject[`pipelineSequence.${firstColumnStatus}`] = dealId; 
            
            const memberNoAdminList = foundDeal?.linkedCustomer?.linkedTeam?.members.filter(member => !ADMIN_ROLES.includes(member.role)).map(member => member._id)
            await UserModel.updateMany({_id: {$in: memberNoAdminList} },{$push: pipelineObject, $pull: pullObject});
            await UserModel.updateMany({role: {$in: ADMIN_ROLES}},{$push: pipelineObject,  $pull: pullObject});
            await DealModel.findByIdAndUpdate(dealId, {userValues: updatedUserValues});

            currentUser.pipelineSequence.set(secondColumnStatus, secondColumnData);
        }
        currentUser.pipelineSequence.set(firstColumnStatus, firstColumnData);
        const savedUserSequence = await currentUser.save();
        return res.status(200).json({
            success: true,
            data: savedUserSequence,
        })
    }catch (err) {
        console.log(err)
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
    }
}

   module.exports = {getDealsForPipeline, updatePipelineDealStage}
