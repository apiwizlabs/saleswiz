import React, {useState, useEffect, useRef} from 'react';
import { UserAPI } from '../../../api/apiConfig';
import moment from "moment";
import { capitalizeFirstLetters } from '../../../utils';
import EditUser from './EditUser';
import CenterModal from '../../../components/Modals/CenterModal';
import { Loader } from '../../../components/Loader';
import useOutsideClick from '../../../utils/useOutsideClick';
import { useOutletContext } from 'react-router-dom';
import {toast} from 'react-toastify';
import { InvitesAPI } from '../../../api/apiConfig';


const ActiveUsers = () => {
    const [editUserToggle, setEditUserToggle] = useState({show: false, data: null});
    const [allUsers, setAllUsers] = useState(null);
    const [loading, setLoading] = useState(false);


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true);
                const allUsersData = await UserAPI.getAllUsers()
                if(allUsersData.status === 200){
                    console.log(allUsersData,"::: USRS DATA");
                    setAllUsers(allUsersData?.data?.data?.users);
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])

    return (
        <div className='w-100 h-100'>
            {loading ? <Loader /> : allUsers && allUsers?.length > 0 ? 
            <table className='mt-20px'>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Modified time</th>
                    </tr>
                    {allUsers.map(user => {
                    return(
                    <TableRow setLoading={setLoading} user={user} setEditUserToggle={setEditUserToggle} setAllUsers={setAllUsers} />
                    )})}
            </table> : 
            <p>No Users Yet</p>}
             {editUserToggle.show && 
            <CenterModal children={<EditUser setUsersData={setAllUsers} editUserToggle={editUserToggle} setEditUserToggle={setEditUserToggle} />} />}
        </div>
    );
};

const TableRow = ({user, setEditUserToggle, setAllUsers, setLoading}) => {
    const [currentUserData, setCurrentUserData] = useOutletContext();
    console.log(currentUserData, "URRENT USER DATA");

    const [showDropdown, setShowDropdown] = useState(false);
    const [activeRow, setActiveRow] = useState(false);
    const dropdownRef = useRef(null);

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)

    })

    const handleLockUser = async (userId) => {
        setShowDropdown(false);
        try{
          setLoading(true);
          const disabledInvite = await UserAPI.updateUser(userId, {isLocked: true});
          if(disabledInvite.status === 200){
            toast.success("User has been Disabled", {autoClose: 3000});
            const getAllUsers = await UserAPI.getAllUsers();
            if(getAllUsers?.status === 200){
                setAllUsers(getAllUsers?.data?.data?.users);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }

    const handleUnlockUser = async (userId) => {
        setShowDropdown(false);
        try{
          setLoading(true);
          const disabledInvite = await UserAPI.updateUser(userId, {isLocked: false});
          if(disabledInvite.status === 200){
            toast.success("User has been Enabled", {autoClose: 3000});
            const getAllUsers = await UserAPI.getAllUsers();
            if(getAllUsers?.status === 200){
                setAllUsers(getAllUsers?.data?.data?.users);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        setShowDropdown(false);
        try{
          setLoading(true);
          const disabledInvite = await UserAPI.updateUser(userId, {isDeleted: true});
          if(disabledInvite.status === 200){
            toast.success("User has been deleted", {autoClose: 3000});
            const getAllUsers = await UserAPI.getAllUsers();
            if(getAllUsers?.status === 200){
                setAllUsers(getAllUsers?.data?.data?.users);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }


    {console.log(user, "THE USER !@#")}

    return (
        <tr  onMouseEnter={()=>{setActiveRow(true)}} 
        onMouseLeave={()=>{
            if(!showDropdown){ setActiveRow(false)}
        }}>
        <td>{user?.firstName + " " + user?.lastName}</td>
        <td>{user?.email}</td>
        <td>{capitalizeFirstLetters(user?.role?.split("_").join(" "))}</td>
        <td className='d-flex justify-content-between position-relative'>
        {moment(user.mts).format('MMM DD, YYYY hh:mm A')}
            { activeRow && currentUserData?.userRole === "ADMIN" && 
            <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary '>
                <i onClick={()=>{
                    setEditUserToggle({show: true, data: user})
                }} className="ri-pencil-line fs-14px lh-14px px-8px py-11px cursor"></i>
                <div className='position-relative'>
                    <i onClick={()=>{
                        setShowDropdown(true);
                     }} className="ri-more-2-line fs-20px lh-20px px-8px py-11px cursor"> </i>
                    {showDropdown && (
                    <div ref={dropdownRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                        <p onClick={()=>{user?.isLocked ? handleUnlockUser(user._id) : handleLockUser(user._id)}} className='table-dropdown-item'>{user?.isLocked ? "Enable User" : "Disable User"}</p>
                        <p onClick={()=>{handleDeleteUser(user._id)}} className='table-dropdown-item'>Delete User</p>
                    </div>)}
                </div>
            </div>}
        </td>
    </tr>
    )
}

export default ActiveUsers;