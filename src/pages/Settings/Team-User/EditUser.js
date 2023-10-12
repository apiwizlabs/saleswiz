import React, { useState } from 'react';
import Select from 'react-select';
import { rolesOptions } from '../../../utils/constants';
import { UserAPI } from '../../../api/apiConfig';

const EditUser = ({editUserToggle, setEditUserToggle, setUsersData}) => {

    const handleClose = () => {
        setEditUserToggle({data: null, show: false})
    }

    const [editUserInput , setEditUserInput] = useState({
        role: rolesOptions.find(item => item.value === editUserToggle?.data?.role),
        email: editUserToggle?.data?.email,
    });

    const handleUpdateUser = async () => {
        try{
            const updatedUser = await UserAPI.updateUser(editUserToggle?.data?._id , {role: editUserInput?.role.value, isLocked: editUserInput?.locked, isDeleted: editUserInput?.deleted});
            if(updatedUser.status===200){
                const usersData = await UserAPI.getAllUsers()
                setUsersData(usersData?.data?.data?.users);
            }
           handleClose()
        }catch(err){
            handleClose()
            console.error(err)
        }
    }



    return (
        <div className='w-573px'>
        <div className='modal-header-1 mx-25px mt-25px'>
            <div className='d-flex justify-content-between'>
                <p className='fs-18px fw-700 lh-28px'>Edit User</p>
                <p><i onClick={handleClose} className="ri-close-line fs-24px lh-24px cursor"></i></p>
            </div>
        </div>
        <div>
            <div className='d-flex px-20px gap-6px'>
                <div className='w-342px d-flex flex-column'>
                <label className='fw-500 mb-6px mt-16px' htmlFor='email'>Email</label>
            <input className='h-40px py-8px px-12px br-6px input-styles w-100 disabled' id="email" 
            disabled value={editUserInput.email} type='text'/>

                </div>
                <div className='w-193px'>
                <label className='fw-500 mb-6px mt-16px' htmlFor='last-name'>Select Role</label>
                <Select
                    value={editUserInput.role}
                    name="role"
                    components={{ 
                        IndicatorSeparator: () => null
                    }}
                    onChange={(chosenOption)=> {
                        console.log(chosenOption)
                        setEditUserInput(prev => ({...prev, role: chosenOption}))
                    }}
                    options={rolesOptions}
                    classNamePrefix="select"
                />            

                </div>
                
            </div>
            <div className='d-flex justify-content-center gap-12px mt-32px px-24px pb-24px'>
                <button onClick={handleClose} className='secondary-btn py-10px px-16px flex-1 d-flex-center'>Cancel</button>
                <button onClick={()=>handleUpdateUser()} className='primary-btn flex-1'>Confirm</button>
            </div>

        </div>

</div>
    );
};

export default EditUser;