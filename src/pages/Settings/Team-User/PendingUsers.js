import React, {useEffect, useState, useRef, useLayoutEffect} from 'react';
import { InvitesAPI } from '../../../api/apiConfig';
import moment from "moment";
import { capitalizeFirstLetters } from '../../../utils';
import EditUser from './EditUser';
import CenterModal from '../../../components/Modals/CenterModal';
import { Loader } from '../../../components/Loader';
import { useOutletContext } from 'react-router-dom';
import useOutsideClick from '../../../utils/useOutsideClick';
import PendingEditModal from './PendingEditModal';
import {toast} from "react-toastify";

const PendingUsers = () => {

    const [loading, setLoading] = useState(false);
    const [pendingUsersData, setPendingUsersData] = useState(null);
    const [pendingEditToggle, setPendingEditToggle] = useState({data: null, show: false});

    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true);
                const allInvites = await InvitesAPI.getAllInvites();
                console.log("MEOW123 ")

                if(allInvites.status === 200){
                    console.log(allInvites,"::: USRS123 DATA");
                    const filteredData = allInvites?.data?.data.filter(user =>{
                        console.log("registeres user :",user);
                        return !user.isRegistered
                    })
                    setPendingUsersData(filteredData);
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])

    return (
        <div>
            {loading ? <Loader /> : (pendingUsersData && pendingUsersData?.length > 0) ? 
            <table className='mt-20px'>
                    <tr>
                        <th>Invited Email</th>
                        <th>Last Invited By </th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                    {pendingUsersData.map(pendingUser => {
                    return(
                    <TableRow setLoading={setLoading} setPendingUsersData={setPendingUsersData} pendingUser={pendingUser} setPendingEditToggle={setPendingEditToggle} />
                    )})}
            </table> : 
            <p>No Users Yet</p>}
            {pendingEditToggle?.show && <CenterModal children={<EditUser setPendingUsersData={setPendingUsersData} pendingEditToggle={pendingEditToggle} setPendingEditToggle={setPendingEditToggle} />} />}
            
        </div>
    );
};

const TableRow = ({pendingUser, setPendingEditToggle, setPendingUsersData, setLoading}) => {
    const [currentUserData, setCurrentUserData] = useOutletContext();
    console.log(currentUserData, "URRENT USER DATA");
    const [activeRow, setActiveRow] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [width, setWidth] = useState(80);
    const dropdownRef = useRef(null);

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)

    })



    const handleDisableInvite = async (inviteId) => {
        setShowDropdown(false);
        try{
          setLoading(true)
          const disabledInvite = await InvitesAPI.updateInvite(inviteId, {isDisabled: true});
          if(disabledInvite.status === 200){
            toast.success("Invite has been disabled", {autoClose: 3000});
            const getAllInvites = await InvitesAPI.getAllInvites();
            if(getAllInvites.status === 200){
                setPendingUsersData(getAllInvites?.data?.data);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }

    const handleEnableInvite = async (inviteId) => {
        setShowDropdown(false);
        try{
          setLoading(true)
          const disabledInvite = await InvitesAPI.updateInvite(inviteId, {isDisabled: false});
          if(disabledInvite.status === 200){
            toast.success("Invite has been enabled", {autoClose: 3000});
            const getAllInvites = await InvitesAPI.getAllInvites();
            if(getAllInvites.status === 200){
                setPendingUsersData(getAllInvites?.data?.data);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }

    const handleDeleteInvite = async (inviteId) => {
        setShowDropdown(false);
        try{
          setLoading(true)
          const disabledInvite = await InvitesAPI.updateInvite(inviteId, {isDeleted: true});
          if(disabledInvite.status === 200){
            toast.success("Invite has been deleted", {autoClose: 3000});
            const getAllInvites = await InvitesAPI.getAllInvites();
            if(getAllInvites.status === 200){
                setPendingUsersData(getAllInvites?.data?.data);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }
    }

    const handleResendInvite = async (inviteId) => {
        setShowDropdown(false);
        try{
          setLoading(true)
          const resendInvite = await InvitesAPI.resendInvite(inviteId);
          if(resendInvite.status === 200){
            toast.success("Invite has been resent", {autoClose: 3000});
            const getAllInvites = await InvitesAPI.getAllInvites();
            if(getAllInvites.status === 200){
                setPendingUsersData(getAllInvites?.data?.data);
            }
          }
          setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false)
        }

    }

    return (
    <tr    
    onMouseEnter={()=>{setActiveRow(true)}} 
    onMouseLeave={()=>{
        if(!showDropdown){ setActiveRow(false)}
    }}>
        {console.log("width of tr :: ",width)}
        <td>{pendingUser?.email}</td>
        <td>{pendingUser?.lastInvitedBy?.firstName}</td>
        <td>{capitalizeFirstLetters(pendingUser?.role.split("_").join(" "))}</td>
        <td className='position-relative'>
            <div className='d-flex justify-content-between'>
                {pendingUser?.isDisabled ? "Disabled" : "Pending"}
                {activeRow && currentUserData?.userRole === "ADMIN" && !pendingUser?.isRegistered && <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary '>
                    <div className='position-relative'>
                        <i onClick={()=>{
                            setShowDropdown(true);
                        }} className="ri-more-2-line fs-20px lh-20px px-8px py-11px cursor"> </i>
                        {showDropdown && (
                        <div ref={dropdownRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                            {/* <p className='table-dropdown-item'>{user?.isLocked ? "Enable User" : "Disable User"}</p> */}
                            <p onClick={pendingUser.isDisabled ? ()=>handleEnableInvite(pendingUser._id) : ()=>handleDisableInvite(pendingUser._id)} className='table-dropdown-item'>{pendingUser?.isDisabled ? "Enable Invite" : "Disable Invite"}</p>
                            <p onClick={()=>handleDeleteInvite(pendingUser._id)} className='table-dropdown-item'>Delete Invite</p>
                            <p onClick={()=>handleResendInvite(pendingUser._id)} className='table-dropdown-item'>Resend Invite</p>
                        </div>)}
                    </div>
                </div>}
            </div>
        </td>
    </tr>
    )
}

export default PendingUsers;