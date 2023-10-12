import axios from "axios";
import config from "../config";
import { errorCallback } from "../utils";

let headers = {
Accept: "application/json, text/plain, */*",
"Content-Type": "application/json",
"Access-Control-Allow-Origin": "*",
};

let securedHeaders = {
...headers,
authorization: `Bearer ${localStorage.getItem("wizforce-token")}`,
};

let fileUploadHeaders = {
...securedHeaders,
"Content-Type": "multipart/form-data",
};

const uploadFileInstance = axios.create({
baseURL: config.API_BASE_URL,
headers: fileUploadHeaders,
});

const axiosInstance = axios.create({
baseURL: config.API_BASE_URL,
headers: securedHeaders,
});

axiosInstance.interceptors.response.use((response) => response, errorCallback);
uploadFileInstance.interceptors.response.use((response) => response, errorCallback);

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("wizforce-token");
    if(token){
        config.headers.authorization = `Bearer ${token}`
    }
    return config;
});

uploadFileInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("wizforce-token");
    if(token){
      config.headers.authorization = `Bearer ${token}`
    }
    return config;
  });

  export const AuthAPI = {
    basicLogin({password, email}) {
      return axiosInstance.post("/auth/basic", {password, email})
    },
    basicSignup(data){
        return axiosInstance.post("/auth/signup/basic", data)
    },
    googleSignup(data){
        return axiosInstance.post("/auth/signup/google", data)
    },
    googleAuthorise(data) {
      return axiosInstance.post("/auth/google", data)
    },
    resetPasswordVerify({emailId}){
      return axiosInstance.post("/auth/verify", {emailId})      
    },
    resetPassword({emailId, password, resetToken}){
      return axiosInstance.post("/auth/reset", {emailId, password, resetToken})      
    },
  }

  export const InvitesAPI = {
    sendInvites(data) {
      return axiosInstance.post("/auth/invite", data)
    },
    getAllInvites() {
      return axiosInstance.get("/auth/invites")
    },
    updateInvite(inviteId, data){
      return axiosInstance.put(`/auth/invite/${inviteId}`, data)
    },
    resendInvite(inviteId){
      return axiosInstance.post(`auth/resend/${inviteId}`)
    }
  }

  export const CurrencyAPI = {
    createCurrency({currencyValue, currencyLabel}) {
      return axiosInstance.post("/currency", {currencyValue, currencyLabel})
    },
    getCurrencies() {
      return axiosInstance.get("/currency")
    },
    deleteCurrency(currencyId){
      return axiosInstance.delete(`/currency/${currencyId}`)
    },
  }

  export const UserAPI = {
    getAllUsers() {
      return axiosInstance.get("/users")
    },
    getUserById(id){
      console.log(id, "in id")
      return axiosInstance.get(`/users/${id}`)
    },
    updateUser(userId, data){
      return axiosInstance.put( `/users/${userId}` , data);
    },
    removeProfilePicture(){
      return axiosInstance.put( `/users/removedp`);
    }
  }

  export const ContactsAPI = {
    getAllContacts(argList) {
      if(argList?.queries){
        const {queries} = argList
        return axiosInstance.get(`/contacts/?page=${queries?.currentPage||""}&limit=${queries?.pageSize||""}&searchInput=${queries?.searchInput||""}&customerIdList=${queries?.customersIdList?.length > 0 ? queries?.customersIdList?.join(",") :""}&teamIdList=${queries?.teamsIdList?.length > 0 ? queries?.teamsIdList?.join(",") : ""}&dateFrom=${queries?.dateFrom||""}&dateTo=${queries?.dateTo||""}`);      
      }
      return axiosInstance.get("/contacts");
    },
    createContact(data){
      console.log("im in cont creation");
      return axiosInstance.post(`/contacts`, data)
    },
    getContactById(contactId) {
      return axiosInstance.get(`/contacts/${contactId}`)
    },
    updateContact(contactId, data){
      return axiosInstance.put(`/contacts/${contactId}`, data)
    },
    deleteContact(contactId){
      return axiosInstance.delete(`/contacts/${contactId}`)
    }
  }

  export const TeamAPI = {
    getAllTeams() {
      return axiosInstance.get("/teams")
    },
    getTeamById(teamId) {
      return axiosInstance.get(`/teams/${teamId}`)
    },
    createTeam(data){
      return axiosInstance.post(`/teams`, data)
    },
    updateTeam(teamId, data){
      return axiosInstance.put(`/teams/${teamId}`, data)
    },
    deleteTeam(teamId){
      return axiosInstance.delete(`/teams/${teamId}`)
    }
  }

  export const LeadsAPI = {
    getAllCustomers(argList) {
      if(argList?.queries){
        const {queries} = argList
        return axiosInstance.get(`/customers/?page=${queries?.currentPage||""}&limit=${queries?.pageSize||""}&searchInput=${queries?.searchInput||""}&contactIdList=${queries?.contactIdList?.length > 0 ? queries?.contactIdList?.join(",") :""}&dealIdList=${queries?.dealIdList?.length > 0 ? queries?.dealsIdList?.join(",") :""}&teamIdList=${queries?.teamsIdList?.length > 0 ? queries?.teamsIdList?.join(",") : ""}&dateFrom=${queries?.dateFrom||""}&dateTo=${queries?.dateTo||""}`);      
      }
      return axiosInstance.get(`/customers`);
    },
    createCustomer(data){
      return axiosInstance.post(`/customers`, data)
    },
    getCustomerById(customerId) {
      return axiosInstance.get(`/customers/${customerId}`)
    },
    updateCustomer(customerId, data){
      return axiosInstance.put(`/customers/${customerId}`, data)
    },
    deleteCustomer(customerId){
      return axiosInstance.delete(`/customers/${customerId}`)
    }
  }

  export const DealsAPI = {
    getAllDeals(argList) {
      if(argList?.queries){
        const {queries} = argList
        return axiosInstance.get(`/deals/?page=${queries?.currentPage||""}&limit=${queries?.pageSize||""}&searchInput=${queries?.searchInput||""}&customerIdList=${queries?.customersIdList?.length > 0 ? queries?.customersIdList?.join(",") :""}&teamIdList=${queries?.teamsIdList?.length > 0 ? queries?.teamsIdList?.join(",") : ""}&dateFrom=${queries?.dateFrom||""}&dateTo=${queries?.dateTo||""}`);      
      }
      return axiosInstance.get(`/deals`);
    },
    createDeal(data){
      return axiosInstance.post(`/deals`, data)
    },
    getDealById(dealId) {
      console.log(dealId, "DEAL IDDD ::")
      return axiosInstance.get(`/deals/${dealId}`)
    },
    updateDeal(dealId, data){
      return axiosInstance.put(`/deals/${dealId}`, data)
    },
    deleteDeal(dealId){
      return axiosInstance.delete(`/deals/${dealId}`)
    }
  }

  export const ApprovalsAPI = {
    getAllApprovals() {
      return axiosInstance.get("/approvals");
    },
    updateApproval({approvalId, status}){
      return axiosInstance.put(`/approvals/${approvalId}`, {status})
    }
  }

//   router.route("/:dealId").post(isAuthenticated, createNoteController);
// router.route("/:dealId").get(isAuthenticated, getNotesController);
// router.route("/:notesId").put(isAuthenticated, updateNoteController);
// router.route("/:notesId").delete(isAuthenticated, deleteNoteController);

export const NotesAPI = {
  getNotes(dealId){
    return axiosInstance.get(`/notes/${dealId}`);
  },
  createNote(dealId, data){
    return axiosInstance.post(`/notes/${dealId}`, data);
  },
  editNote(noteId, data){
    return axiosInstance.put(`/notes/${noteId}`, data);
  },
  deleteNote(noteId){
    return axiosInstance.delete(`/notes/${noteId}`);
  },
}
// router.route("/:activityType").get(isAuthenticated, getMyActivitiesController);
// router.route("deal/:dealId/:activityType").get(isAuthenticated, getActivitiesController);
// router.route("/:dealId").post(isAuthenticated, createActivityController);
// router.route("/:activityId").put(isAuthenticated, updateActivityController);
// router.route("/:activityId").delete(isAuthenticated, deleteActivityController);
export const ActivityAPI = {
  getDealActivities({dealId, type}){
    return axiosInstance.get(`/activities/deal/${dealId}/${type}`);
  },
  getMyActivities({type, queries}){
    if(queries){
      return axiosInstance.get(`/activities/${type}?page=${queries?.currentPage||""}&limit=${queries?.pageSize||""}&searchInput=${queries?.searchInput || ""}&assignedToList=${queries?.assignedToList?.join(",")||""}&dealIdList=${queries?.dealIdList?.join(",")||""}&priority=${queries?.priority||""}&status=${queries?.status||""}&dateFrom=${queries?.dateFrom||""}&dateTo=${queries?.dateTo||""}`);      
    }
    return axiosInstance.get(`/activities/${type}`);
  },
  createActivity(dealId, data){
    return axiosInstance.post(`/activities/${dealId}`, data);
  },
  updateActivity(activityId, data){
    return axiosInstance.put(`/activities/${activityId}`, data);
  },
  deleteActivity(dealId, activityId){
    return axiosInstance.delete(`/activities/${dealId}/${activityId}`);
  },
}

  // export const TeamAPI = {
  //   getAllTeams() {
  //     return axiosInstance.get("/teams")
  //   },
  //   getTeamById(teamId) {
  //     return axiosInstance.get(`/teams/${teamId}`)
  //   },
  //   createTeam(data){
  //     return axiosInstance.post(`/teams`, data)
  //   },
  //   updateTeam(teamId, data){
  //     return axiosInstance.put(`/teams/${teamId}`, data)
  //   },
  //   deleteTeam(teamId){
  //     return axiosInstance.delete(`/teams/${teamId}`)
  //   }
  // }
  
  export const TemplateAPI = {
    getTemplateByType(type) {
      return axiosInstance.get(`/templates/${type}`)
    },
    createFormField(type, data){
      console.log("creatinggg")
      return axiosInstance.post(`/templates/${type}`, {formFieldData : data})
    },
    updateFormField(type, data){
      return axiosInstance.put(`/templates/${type}/${data._id}`, {formFieldData : data})
    },
    deleteFormField(type, _id){
      return axiosInstance.delete(`/templates/${type}/${_id}`)
    }
  }

  export const PipelinesAPI = {
    getPipelineData() {
      return axiosInstance.get(`/pipeline`)
    },
    updatePipelineData({firstColumnData, firstColumnStatus, secondColumnData, secondColumnStatus, dealId}){
      return axiosInstance.put(`/pipeline`, {firstColumnData, firstColumnStatus, secondColumnData, secondColumnStatus, dealId})
    }
  }

  export const FilesAPI = {
    getFilesByDeal(dealId) {
      return axiosInstance.get(`/files/${dealId}`)
    },
    uploadLink(dealId, data){
      return axiosInstance.post(`files/link/${dealId}`, data)
    },
    uploadProfilePicture(fileObj){
      const formData = new FormData();
      formData.append("file", fileObj, fileObj.name);
      console.log(formData, "FORM DATA")
      return uploadFileInstance.post(`/files/profile`,formData);
    },
    removeProfilePic(){
      return axiosInstance.delete(`/files`)
    },
    uploadFile(dealId, fileObj){
      const formData = new FormData();
      formData.append("file", fileObj, fileObj.name);
      console.log(formData, "FORM DATA")
      return uploadFileInstance.post(`/files/single/${dealId}`, formData)
    },
    deleteFile(dealId, attachmentId){
      return axiosInstance.delete(`/files/${dealId}/${attachmentId}`)
    },
    downloadFile(dealId, fileKey){
      return axiosInstance.get(`/files/${dealId}/${fileKey}`,
      {
        responseType: "blob",
      })
    },

   
  }


  export const NotificationsAPI = {
    getAllNotifications(){
      return axiosInstance.get('/notifications')
    },
    deleteNotificationById({id}){
      return axiosInstance.delete(`/notifications/${id}`)
    },
    deleteAllNotifications(){
      return axiosInstance.delete(`/notifications`)
    }
  }
  