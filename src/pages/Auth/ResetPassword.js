
import React, { useState, useEffect } from 'react';
import ApiwizIcon from "../../assets/apiwiz-logo.png"
import { encrypt, passwordRegex } from '../../utils';
import { AuthAPI } from '../../api/apiConfig';
import jwt_decode from "jwt-decode";
import {toast} from "react-toastify";
import { useNavigate, useParams } from 'react-router';
import config from '../../config';


const ResetPassword = () => {
    const [passwordInput, setPasswordInput] = useState({password: "", confirmPassword: ""});
    const {token} = useParams();
    const [passwordError, setPasswordError]= useState({});
    const [showPswd, setShowPswd] = useState({confirmPassword: false, password: false})
    const navigate = useNavigate()
    const validate = (values) => {
        const errors = {}
        if(!values.password){
            errors.password = "Password is required"
        }else if(!passwordRegex.test(values.password)){
            errors.password = "Password must be at least 6 characters and contain at least 1 number and 1 special character"
        }
        if(!values.confirmPassword){
            errors.confirmPassword = "Please retype password"
        }else if(values.confirmPassword !== values.password){
         errors.confirmPassword = "Passwords dont match."
        }
        return errors;
    }

  useEffect(()=>{
      let dateNow = new Date();
      try{
          if(jwt_decode(token).exp < (dateNow.getTime() / 1000)){
              navigate('/expired')
          }
      }catch(err){
          navigate('/expired')
      }
  }, [token])

    const handleChangePswd = async () => {
        const errors = validate(passwordInput);
        setPasswordError(errors);
      if(Object.keys(errors).length > 0){
        return;
      }
      try{
        const changedPassword = await AuthAPI.resetPassword({emailId : jwt_decode(token).emailId, password: encrypt(passwordInput.password), resetToken: token});
        if(changedPassword.status === 200){
            toast.success("Login Using yur new password");
            navigate("/login")
        }
      }catch(err){
        console.error(err, "::ERROR")      
      }
    }




    return (
        <div className='w-360px m-auto mt-32px'>
            <img className='m-auto d-block' width={"48px"} height={"48px"} src={ApiwizIcon} />            
            <p className='text-center color-grey-700 fw-700 fs-24px mt-16px lh-28px mb-24px '>Reset Password</p>
            <div className='d-flex flex-column'>
            <label className='fw-500 fs-14px mb-6px mt-24px' htmlFor='password'>Password</label>
            <div className='position-relative'>
                <input type={showPswd.password ? "text" :"password"} value={passwordInput.password} className={`h-40px py-8px px-12px pr-45px br-6px input-styles w-100 ${passwordError?.password ? 'error-input': ""}`} id="password" onChange={(e)=>{setPasswordInput(prev => ({...prev, password: e.target.value}))}}  placeholder='Type your Password' />
                {showPswd.password ? <i onClick={()=>setShowPswd(prev => ({...prev, password: !prev.password}))} className="ri-eye-off-line position-absolute eye-icon cursor"></i> : <i onClick={()=>setShowPswd(prev => ({...prev, password: !prev.password}))} className="ri-eye-line position-absolute eye-icon cursor"></i>}
            </div>
            {passwordError?.password && <p className='error-txt'>{passwordError?.password}</p>}
            <label className='fw-500 fs-14px mb-6px mt-24px' htmlFor='c-pswd'>Confirm Password</label>

            <div className='position-relative'>
                <input value={passwordInput?.confirmPassword}  type={showPswd.confirmPassword ? "text" :"password"} className={`h-40px py-8px px-12px pr-45px br-6px input-styles w-100 ${passwordError?.confirmPassword ? 'error-input': ""}`}  id="c-pswd"   onChange={(e)=>{setPasswordInput(prev => ({...prev, confirmPassword: e.target.value}))}}  placeholder='Re-Type your Password' />
                {showPswd.confirmPassword ? <i onClick={()=>setShowPswd(prev => ({...prev, confirmPassword: !prev.confirmPassword}))} className="ri-eye-off-line position-absolute eye-icon cursor"></i> : <i onClick={()=>setShowPswd(prev => ({...prev, confirmPassword: !prev.confirmPassword}))} className="ri-eye-line position-absolute eye-icon cursor"></i>}
            </div>
            {passwordError?.confirmPassword && <p className='error-txt'>{passwordError?.confirmPassword}</p>}
            </div>
            <button onClick={handleChangePswd} className='primary-btn h-44px w-100 mt-32px'>Reset Password</button>

        </div>
    );
};

export default ResetPassword;