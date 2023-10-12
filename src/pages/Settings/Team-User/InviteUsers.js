import React, { useState } from 'react';
import Select from 'react-select';
import { rolesOptions } from '../../../utils/constants';
import { emailRegex } from '../../../utils';
import { InvitesAPI } from '../../../api/apiConfig';
import { Loader } from '../../../components/Loader';
import {toast} from "react-toastify";


const InviteUsers = ({handleClose, callback}) => {


    const [invitedUsers, setInvitedUsers] = useState([{email: "", role: ""}]);
    const [inviteErrors, setInviteErrors] = useState([]);
    const [loading, setLoading] = useState(false);


    const validate = (values) => {
        let errors = [];
        for(let i = 0; i < values.length; i++){
            const {email, role} = values[i];
            if(!role){
                errors[i]={...errors[i], role: "Role is Required"}
            }
            if(!email){
                errors[i]={...errors[i], email: "Email is Required"}
            }else if(!emailRegex.test(email)){
                errors[i]={...errors[i], email: "Enter a valid Email"}
            }
        }
        return errors;
    }

    const handleSubmit = async () => {
        const errors = validate(invitedUsers);
        setInviteErrors(errors);
        if(errors?.length > 0){
            return;
        }
        setLoading(true)
        try{
            const sentInvites = await InvitesAPI.sendInvites({userDetails: invitedUsers})
            if(sentInvites.status === 200){
                const skippedEmails = sentInvites?.data?.skippedEmails;
                if(skippedEmails?.length > 0){
                    toast.warning(`Some Emails were not sent, ${skippedEmails.toString().split(",").join("  ")} `, {autoClose: false})
                }else{
                    toast.success("All Invites have been sent", {autoClose: 3000});
                }
            }
            console.log(sentInvites, ":: SENT INVITES");
            setLoading(false);
            handleClose();
            callback()
        }catch(err){
            setLoading(false);
            handleClose()
        }
        console.log("ERRORS :: ",errors);
    }

    return (
        <div className='w-573px '>
            <div className='modal-header-1 mx-25px mt-25px mb-20px'>
                <div className='d-flex justify-content-between'>
                    <p className='fs-18px fw-700 lh-28px'>Invite Users</p>
                    <p><i onClick={handleClose} className="ri-close-line fs-24px lh-24px cursor"></i></p>
                </div>
            </div>
            {loading ? <div className="h-300px w-100"><Loader /></div> :
            <div>
            {invitedUsers.map((invitedUser, i) => {
                return (
                    <div className='d-flex align-items-end px-20px gap-6px mb-8px'>
                    <div className='w-342px d-flex flex-column'>
                        <label className='fw-500 mb-6px' htmlFor='email'>Email</label>
                        <input onChange={(e)=>{
                            const _invitedUsers = [...invitedUsers]
                            _invitedUsers[i].email = e.target.value
                            setInvitedUsers(_invitedUsers)}}   
                            className={`h-40px py-8px px-12px br-6px input-styles w-100 ${inviteErrors[i]?.email ? 'error-input' : ''}`} id="email" type='email'/>
                    </div>
                    <div className='w-159px'>
                        <label className='fw-500' htmlFor='last-name'>Select Role</label>
                        <Select
                            name="role"
                            components={{ 
                                IndicatorSeparator: () => null
                            }}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: inviteErrors[i]?.role ? 'var(--error-50)' : 'transparent',
                                    borderColor: inviteErrors[i]?.role ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 61 }),
                            }}
                            onChange={(e)=>{
                                const _invitedUsers = [...invitedUsers]
                                _invitedUsers[i].role = e.value
                                setInvitedUsers(_invitedUsers)}}  
                            options={rolesOptions}
                            classNamePrefix="select"
                        />            
                    </div>
                    {i !== 0 && <div 
                    onClick={()=>{
                        const _invitedUsers = [...invitedUsers];
                        _invitedUsers.splice(i, 1);
                        setInvitedUsers(_invitedUsers);
                    }} className='d-flex-center w-28px h-28px mb-6px p-4px icon-btn-grey cursor'>
                        <i className="ri-delete-bin-5-line "></i>
                    </div>}
                </div>
                )
            })}
            
            <div onClick={()=>{
                setInvitedUsers(prev => ([...prev, {email: "",role: "" }]))
            }} className='d-flex w-max-content cursor pl-20px'>
                <i className="ri-add-line fs-20px lh-20px"></i><p className='fs-14px color-grey-700 fw-500'>Add More</p>
            </div>
            <div className='d-flex justify-content-center gap-12px mt-32px px-24px pb-24px'>
                <button onClick={handleClose} className='secondary-btn py-10px px-16px flex-1 d-flex-center'>Cancel</button>
                <button onClick={handleSubmit} className='primary-btn flex-1'>Invite</button>
            </div>

            </div>}
        </div>
    );
};

export default InviteUsers;