import React from 'react';
import { useState, useEffect } from 'react';
import UploadIcon from '../../assets/icons/ri_download-line.svg'
import { useOutletContext } from 'react-router-dom';
import { UserAPI, FilesAPI } from '../../api/apiConfig';
import { throwServerError } from '../../utils/errorHandling';
import {Loader} from '../../components/Loader';
import { capitalizeFirstLetters } from '../../utils';
import DefaultAvatar from "../../assets/default-avatar.png";
import { AuthAPI } from '../../api/apiConfig';
import Spinner from 'react-bootstrap/Spinner';
import { toast } from 'react-toastify';


const Profile = () => {
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [btnLoading, setBtnLoading] = useState(false);
    const [profileEditToggle, setProfileEditToggle] = useState(false);


    const initialProfileValues = {
        role: "",
        email: "",
        firstName: "",
        lastName: "",
        mobile: "",
      }
      const [profileInput, setProfileInput] = useState(initialProfileValues)
      const [userEntryInput, setUserEntryInput] = useState()
      const [profileErrors, setProfileErrors] = useState({});
      const [selectedImage, setSelectedImage] = useState({url: "", file: "", delete: false});

    const handleProfileInput = (evt) => {
       const {name, value} = evt.target;
       setProfileInput({...profileInput, [name]: value});
       setUserEntryInput(prev => ({...prev, [name] : value }))
      }

      const handleAvatarUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(prev => ({...prev, file: file, url: URL.createObjectURL(file), delete: false}));
        } else {
            setSelectedImage(prev => ({...prev, url: "", file: "", delete: true}));
        }
        event.target.value = null;
      };

      const handleUserEdit = async () => {
        try{
            setLoading(true)
          if(!profileInput.firstName.trim()){
            setProfileErrors(prev => ({firstName: "First name is a required field"}));
            return;
          }
          setProfileErrors({});
          console.log( "CUURR ID -- " , currentUserData.userId);
          const data = await UserAPI.updateUser(currentUserData.userId, userEntryInput);
          console.log(selectedImage, "SELECTED IMAGE");
          if(selectedImage?.file && !selectedImage?.delete){
            const profileUrl = await FilesAPI.uploadProfilePicture(selectedImage?.file)
            setSelectedImage({file: "", url: profileUrl.data.imgUrl, delete: false})
          }else if(!selectedImage?.file && selectedImage?.delete){
            const removedPic = await FilesAPI.removeProfilePic()
          }
          console.log("DATA :: ",data);
          const {firstName, lastName, mobile} = data.data.data;
          setProfileInput(prev => ({...prev, firstName, lastName, mobile}))
          setProfileEditToggle(false)
          setLoading(false)
        }
        catch(err){
            setLoading(false)
            console.error(err);
        }
      }

      const handleRestPswd = async () => {
        try{
            setBtnLoading(true)
            const verify = await AuthAPI.resetPasswordVerify({emailId: profileInput?.email})
            if(verify?.status === 200){
                toast.success("We've emailed you password reset instructions.")
            }
            setBtnLoading(false)
        }
        catch(err){
            setLoading(false)
            console.error(err);
        }
      }

      useEffect(()=>{
        console.log(currentUserData, "CURRENT DATA");
        (async ()=>{
            try{
                setLoading(true);
                console.log("current id :: ",currentUserData.userId)
                if(currentUserData.userId){
                    const data = await UserAPI.getUserById(currentUserData.userId);
                    console.log(data, ":: USER DATA");
                    const {firstName, lastName, role, email, mobile, profilePicture} = data.data.data.user;
                    
                    console.log("ROLEE   ::",role)
                    setSelectedImage({file: "", url: profilePicture?.url, delete: false});
                    setProfileInput({firstName, lastName, role: capitalizeFirstLetters(role.split("_").join(" ")), email, mobile});
                    setLoading(false)
                }
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
      },[currentUserData])

    return (
        <div className='h-100 w-100 pb-100px'>
            {loading ?
                <Loader /> :
                <div className='max-w-414px m-auto'>
                    <p className='text-center mt-16px fs-18px fw-500 lh-30px color-grey-900'>Profile Picture</p>
                    <div className='d-flex flex-column align-items-center gap-16px'>
                    <div className='w-183px h-183px br-50 my-16px d-flex-center overflow-hidden'>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                            }}
                            >
                       
                            <img
                            src={selectedImage?.url && !selectedImage?.delete ? selectedImage.url : DefaultAvatar}
                            alt="Selected"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', // Zoom to fill
                            }}
                            />
                        
                        </div>
                    </div>

                   {profileEditToggle && 
                   <div>
                        <label htmlFor='avatar-upload' className='cursor secondary-btn gap-8px w-160px h-40px py-10px px-16px br-6px fs-14px fw-700 color-grey-700'> 
                            <img className='' src={UploadIcon} width={20} height={20} />
                            Upload Photo
                        </label>
                      {selectedImage?.url && <p onClick={async ()=>{
                            setSelectedImage(prev => ({...prev, delete: true}))
                        }} className='text-center p-16px color-grey-500 fw-700 fs-14px cursor'>Remove</p>}
                    </div>
                    }
                    <input onChange={handleAvatarUpload}  className='hidden-file-upload' id="avatar-upload" type="file"/>

                    <div className='d-flex justify-content-between align-items-center mt-24px w-100'>
                    <p className='color-grey-500 fw-500 fs-16px'>User Information</p>
                    {!profileEditToggle && <i onClick={()=>setProfileEditToggle(true)} className="ri-pencil-line lh-15px fs-15px cursor"></i>}
                    </div>

                    <div className='d-flex flex-column w-100 justify-content-center'>
                        
                            <label className='fw-500 mb-6px mt-16px' htmlFor='role'>Role</label>
                            {profileEditToggle ? <input disabled className='h-40px py-8px px-12px br-6px input-styles disabled' id="role" name="role" onChange={handleProfileInput} placeholder={profileInput?.role} type='text'/>
                            : <p className='color-grey-400'>{profileInput?.role}</p> }
                        
                            <label className='fw-500 mb-6px mt-16px' htmlFor='email'>Email</label>
                            
                            {profileEditToggle ? <input disabled className='h-40px py-8px px-12px br-6px input-styles disabled' id="email" name="email" onChange={handleProfileInput} placeholder={profileInput?.email} type='email'/>
                            : <p className='color-grey-400'>{profileInput?.email}</p> }


                            <label className='fw-500 mb-6px mt-16px' htmlFor='firstName'>First Name</label>
                            {profileEditToggle ? 
                            <input className={`h-40px py-8px px-12px br-6px input-styles ${profileErrors?.firstName ? "error-input" : ""}`} id="firstName" name="firstName" onChange={handleProfileInput} value={profileInput?.firstName} placeholder='Type your First Name' type='text'/>
                            : <p className='color-grey-400'>{profileInput?.firstName}</p> }
                            {profileErrors?.firstName && <p className='error-txt'>{profileErrors.firstName}</p>}

                            <label className='fw-500 mb-6px mt-16px' htmlFor='lastName'>Last Name</label>
                            {profileEditToggle ? 
                            <input className='h-40px py-8px px-12px br-6px input-styles' id="lastName" name="lastName" onChange={handleProfileInput} value={profileInput?.lastName} placeholder='Type your Last Name' type='text'/>
                            : <p className='color-grey-400'>{profileInput?.lastName ? profileInput?.lastName : '--'}</p> }
                        
                            <label className='fw-500 mb-6px mt-16px' htmlFor='mobile'>Mobile</label>
                            {profileEditToggle ? 
                            <input className='h-40px py-8px px-12px br-6px input-styles' id="mobile" name="mobile" onChange={handleProfileInput} value={profileInput?.mobile} placeholder='Type your Mobile No' type='text'/>
                            : <p className='color-grey-400'>{profileInput?.mobile ? profileInput?.mobile : '--'}</p> }

                            {profileEditToggle && <div className='mt-16px d-flex justify-content-end gap-8px'>
                                <button onClick={handleUserEdit} className='primary-btn px-15px h-40px w-66px br-6px'>Save</button>
                                <button onClick={()=>{
                                    setSelectedImage(prev => ({...prev, delete: false}))
                                    setProfileEditToggle(false)}} className='secondary-btn w-80px px-16px fw-700 fs-14px color-grey-700'>Cancel</button>
                            </div>}

                        {/* {!profileEditToggle && <div>
                            <p className='color-grey-500 fw-500 fs-16px'>Pass Information</p>
                            
                            </div>} */}


                    </div>                  

                </div>

                <div className='d-flex flex-column align-items-left'>
                        <p className='color-grey-500 fw-500 fs-16px mt-24px mb-16px'>Reset Password</p>
                       <div className='d-flex g-10px align-items-center'>
                            <button onClick={()=>handleRestPswd()} className='primary-btn px-15px mr-30px h-40px w-max-content br-6px'>
                                {btnLoading ? <Spinner animation="border" size="sm" /> : "Reset Password"} 
                            </button>
                       </div>
                    </div>
                </div>
            }        
        </div>
    );
};

export default Profile;