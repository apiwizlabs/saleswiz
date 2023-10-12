import React, { useState } from 'react';
import ApiwizIcon from "../../assets/apiwiz-logo.png"
import { AuthAPI } from '../../api/apiConfig';
import { useNavigate } from 'react-router';
import { emailRegex } from '../../utils';
import {toast} from "react-toastify"

const ResetEmail = () => {
    const [resetPswdEmail, setResetPswdEmail] = useState("");
    const [resetPswdError, setResetPswdError] = useState("");
    const navigate = useNavigate();
    

    const sendResetEmail = async () => {
        if(!resetPswdEmail || !emailRegex.test(resetPswdEmail) ){
            setResetPswdError("Please Enter a valid Email Address")
            return;
        }
        setResetPswdError(null)
        try{
            const userVerify = await AuthAPI.resetPasswordVerify({emailId: resetPswdEmail})
            if(userVerify.status === 200){
                console.log("email sent !")
                toast.success("Reset Email Successfully sent")
            }
        }catch(err){
            console.error(err)
        }
    }
    return (
        <div className='w-360px m-auto'>
        <img className='mt-32px m-auto d-block' src={ApiwizIcon} width={"48px"} height={"48px"}  />
        <p onClick={()=>navigate('/login')} style={{color:"var(--primary-800)"}} className=' cursor fs-14px fw-600 lh-20px mt-24px text-center d-flex-center'> <i className="ri-arrow-left-line fs-16px lh-16px mr-4px"></i>  Back</p>
        <p className='color-grey-700 fw-700 fs-24px text-center mt-16px lh-28px mb-8px'>Password Reset</p>
        <p className='color-grey-600 fs-16px lh-24px wrap-text text-center'>Enter your email address that you used to register. We will send you an email with a link to reset your password</p>
        <div className='d-flex flex-column '>
            <label className='fw-500 fs-14px mb-6px mt-24px' htmlFor='email'>Email</label>
            <input value={resetPswdEmail} onChange={(e)=>{setResetPswdEmail(e.target.value)}} 
            className={`h-40px py-8px px-12px br-6px input-styles ${resetPswdError ? "error-input" : ""}`} 
            id="email" 
            placeholder='Type your Email' type='email'/>
            {resetPswdError && <p className='error-txt'>{resetPswdError}</p>}
        </div>
        <button onClick={sendResetEmail} className='primary-btn h-44px w-100 mt-32px'>Send</button>
       
    </div>
    );
};

export default ResetEmail;