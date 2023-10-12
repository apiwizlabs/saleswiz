import React, { useState, useEffect } from 'react';
import { AuthAPI } from '../../api/apiConfig';
import {useParams, useNavigate} from 'react-router';
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "../../assets/google_icon.svg"
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import config from '../../config';
import { toast } from "react-toastify";
import { passwordRegex, asyncLocalStorage, encrypt } from '../../utils';
import jwt_decode from "jwt-decode";

const Signup = () => {
    const {token} = useParams();
    const navigate = useNavigate();
    const initialSignupValues = {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    }
    const [signupInput, setSignupInput] = useState(initialSignupValues)
    const [signupErrors, setSignupErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


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

      const signup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
          try{
            let _data = { code: tokenResponse.code, inviteToken: token}
            const res = await AuthAPI.googleSignup(_data);
            if(res.status === 201){
              toast.warning("Existing User")
              navigate("/login");
              return;
            }
            asyncLocalStorage.setItem("wizforce-token",res?.data?.data?.token)
            .then(function () {
                return asyncLocalStorage.getItem('wizforce-token');
            }).then(function (value) {
                if(value){
                    navigate("/")
                }
            });
          }catch(err){
            console.error(err)
          }
          
        },
        flow: 'auth-code',
    });

    const handleSignup = async () => {
      const errors = validate(signupInput);
      if(Object.keys(errors).length > 0){
        setSignupErrors(errors);
        return;
      }
      try{
        const {status, data} = await AuthAPI.basicSignup({...signupInput, inviteToken: token, password: encrypt(signupInput.password)})
        if(status === 201){
          toast.warning("Existing User")
          navigate("/login");
          return;
        }
        else if(status === 200){
          asyncLocalStorage.setItem("wizforce-token", data?.data?.token)
          .then(function () {
              return asyncLocalStorage.getItem('wizforce-token');
          }).then(function (value) {
              if(value){
                  navigate("/")
              }
          });
        } 
      }catch(err){
        console.error(err, "::ERROR")      
      }
    }

    const validate = (values) => {
      const errors = {}
      if(!values.password){
        errors.password = "Password is required"
      }else if(!passwordRegex.test(values.password)){
        errors.password = "Password must be at least 6 characters and contain at least 1 number and 1 special character"
      }
      if(!values.firstName){
        errors.firstName = "First Name is required"
      }
      if(!values.confirmPassword){
        errors.confirmPassword = "Please retype password"
      }else if(values.confirmPassword !== values.password){
        errors.confirmPassword = "Passwords dont match."
      }
      return errors;

    }

    const handleSignupInput = (evt) => {
     const {name, value} = evt.target;
     setSignupInput({...signupInput, [name]: value});
    }


    return (
      <div className='m-auto mt-32px max-w-360px'>
      <div className='d-flex flex-column justify-content-center'>       
          <img className='w-48px h48px m-auto mb-24px fs-16px fw-700' alt="sales crm logo" src={ApiwizLogo} />
          <p className='fs-24px fw-700 text-center mb-24px'>
            Sign up for Sales CRM
          </p>  
          <button className='w-100 h-44px py-10px px-18px d-flex align-items-center justify-content-center gap-12px google-btn' onClick={()=>signup()}>
                  <img src={GoogleIcon} />  Sign up with Google
                </button>   

          <div className='d-flex align-items-center mt-20px'>
                <div className='divider'></div>
                    <p className='mx-6px'>or</p>
                <div className='divider'></div>
            </div>

            <label className='fw-500 mb-6px mt-24px' htmlFor='first-name'>First Name</label>
            <input className={`h-40px py-8px px-12px br-6px input-styles ${signupErrors?.firstName ? 'error-input' : ''}`} id="first-name" name="firstName"
            value={signupInput.firstName}
            onChange={handleSignupInput} placeholder='Type your First Name' type='text'/>
            {signupErrors?.firstName && <p className='error-txt'>{signupErrors.firstName}</p>}


            <label className='fw-500 mb-6px mt-16px' htmlFor='last-name'>Last Name</label>
            <input className='h-40px py-8px px-12px br-6px input-styles' id="last-name" 
            name="lastName"
            value={signupInput.lastName}
            onChange={handleSignupInput} placeholder='Type your Last Name' type='text'/>

            <label className='fw-500 mb-6px mt-16px'  htmlFor='password'>Password</label>
            <div className='position-relative'>
                <input 
                id="password"  
                name="password"
                value={signupInput.password}
                type={showPassword ? "text" :"password"} 
                className={`h-40px py-8px px-12px pr-45px br-6px input-styles w-100 ${signupErrors?.password ? 'error-input' : ''}`}
                onChange={handleSignupInput} 
                placeholder='Type your Password' />
                {showPassword ? <i onClick={()=>setShowPassword(prev => !prev)} className="ri-eye-off-line position-absolute eye-icon cursor"></i> : <i onClick={()=>setShowPassword(prev => !prev)} className="ri-eye-line position-absolute eye-icon cursor"></i>}
            </div>
            {signupErrors?.password && <p className='error-txt'>{signupErrors.confirmPassword}</p>}

            <label className='fw-500 mt-16px' htmlFor='password'>Confirm Password</label>
            <div className='position-relative'>
                <input 
                type={showConfirmPassword ? "text" :"password"} 
                value={signupInput.confirmPassword}
                name="confirmPassword"
                className={`h-40px py-8px px-12px pr-45px br-6px input-styles w-100 ${signupErrors?.confirmPassword ? 'error-input' : ''}`}
                id="password" 
                onChange={handleSignupInput}
                placeholder='Type your Password' />
                {showConfirmPassword ? <i onClick={()=>setShowConfirmPassword(prev => !prev)} className="ri-eye-off-line position-absolute eye-icon cursor"></i> : <i onClick={()=>setShowConfirmPassword(prev => !prev)} className="ri-eye-line position-absolute eye-icon cursor"></i>}
            </div>
            {signupErrors?.confirmPassword && <p className='error-txt'>{signupErrors.confirmPassword}</p>}

            <button onClick={()=>handleSignup()} className='primary-btn h-44px w-100 mt-32px'>Sign up with email</button>


           {/* <input type="text" onChange={(e)=>setPassword(e.target.value)}/>
            <button onClick={handleSubmit}>Submit</button> */}
           
                    
        </div>
        </div>
    );
};

export default Signup;