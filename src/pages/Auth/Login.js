import React, {useState, useEffect} from 'react';
import { AuthAPI, UserAPI } from '../../api/apiConfig';
import config from '../../config' 
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google"
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import GoogleIcon from "../../assets/google_icon.svg"
import { passwordRegex, emailRegex, encrypt } from '../../utils';
import { useNavigate } from 'react-router';
import { asyncLocalStorage } from '../../utils';


const Login = () => {
    const navigate = useNavigate()
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginErrors, setLoginErrors] = useState({})

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try{
                let _data = { token: tokenResponse.code}
                const res = await AuthAPI.googleAuthorise(_data);
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

    const validate = (values) => {
        const errors = {}
        if(!values.password){
          errors.password = "Password is required"
        }else if(!passwordRegex.test(values.password)){
          errors.password = "Password must be at least 6 characters and contain at least 1 number and 1 special character"
        }
        if(!values.email){
          errors.email = "Email is required"
        }else if(!emailRegex.test(values.email)){
          errors.email = "Please enter a valid email address"
        }
        return errors;
  
      }


    const handleLogin = async () => {
        const errors = validate({password, email});
      setLoginErrors(errors);
      if(Object.keys(errors).length > 0){
        return;
      }

        const encryptedPassword = encrypt(password);
        try{
            const res = await AuthAPI.basicLogin({password: encryptedPassword, email});
            if(res?.status === 200){
                asyncLocalStorage.setItem("wizforce-token",res?.data?.data?.token)
                .then(function () {
                    return asyncLocalStorage.getItem('wizforce-token');
                }).then(function (value) {
                    if(value){
                        navigate("/")
                    }
                });
            }
        }catch(err){
            console.error(err)
        }
    }


    return (
        <div className='m-auto max-w-360px mt-80px'>
        <div className='d-flex flex-column'>
            <img className='w-48px h48px m-auto mb-24px fs-16px fw-700' alt="sales crm logo" src={ApiwizLogo} />
            <p className='fs-24px fw-700 text-center'>
              Sign in to Sales CRM
            </p>
            <div className='mb-20px mt-24px'>
                <button className='w-100 h-44px py-10px px-18px d-flex align-items-center justify-content-center gap-12px google-btn' onClick={()=>login()}>
                  <img src={GoogleIcon} />  Sign in with Google
                </button>
            </div>
            <div className='d-flex align-items-center'>
                <div className='divider'></div>
                    <p className='mx-6px'>or</p>
                <div className='divider'></div>
            </div>
            <label className='fw-500 mb-6px mt-24px' htmlFor='email'>Email</label>
            <input className={`h-40px py-8px px-12px br-6px input-styles ${loginErrors?.email ? 'error-input': ''}`} id="email" onChange={(e)=>setEmail(e.target.value)} placeholder='Type your Email' type='email'/>
            {loginErrors?.email && <p className='error-txt'>{loginErrors?.email}</p>}
            <label className='fw-500 mb-6px mt-16px' htmlFor='password'>Password</label>
            <div className='position-relative'>
                <input type={showPassword ? "text" :"password"} className={`h-40px py-8px px-12px pr-45px br-6px input-styles w-100 ${loginErrors?.password ? 'error-input': ""}`} id="password" onChange={(e)=>setPassword(e.target.value)} placeholder='Type your Password' />
                {showPassword ? <i onClick={()=>setShowPassword(prev => !prev)} className="ri-eye-off-line position-absolute eye-icon cursor"></i> : <i onClick={()=>setShowPassword(prev => !prev)} className="ri-eye-line position-absolute eye-icon cursor"></i>}
            </div>
            {loginErrors?.password && <p className='error-txt'>{loginErrors?.password}</p>}

            <p onClick={()=>{
                navigate('/reset')
            }} className='fw-600 fs-14px lh-20px primary-700 mt-10px cursor mb-32px'>Forgot Password</p>
            <button onClick={()=>handleLogin()} className='primary-btn h-44px w-100'>Sign in with email</button>


            {/* <button onClick={handleSubmit}>Submit</button>
            <button onClick={handleDummyApiCall}>Test API</button> */}
          
        </div>
        </div>
    );
};

export default Login;