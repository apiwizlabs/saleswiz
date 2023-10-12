import React, { useEffect, useState } from 'react';
import CenterModal from '../../../components/Modals/CenterModal';
import {UserAPI} from '../../../api/apiConfig'; 
import InviteUsers from './InviteUsers';
import { Loader } from '../../../components/Loader';
import ActiveUsers from './ActiveUsers';
import PendingUsers from './PendingUsers';

const Users = () => {
    const [showInviteUsers, setShowInviteUsers] = useState(false)
    const [activeSection, setActiveSection] = useState("Active");
    const [loading, setLoading] = useState(false)


    return (
        <div className='px-16px py-20px'>
            <div className='d-flex justify-content-between '>
                <div className='d-flex gap-8px align-items-center'>
                    {activeSection === "Active" ? <button className='highlight-btn px-14px py-10px h-32px d-flex-center '>Active Users</button> : 
                    <p onClick={()=>setActiveSection("Active")} className='color-grey-500 fs-13px fw-700 px-14px py-10px cursor'>Active Users</p>}
                    {activeSection === "Pending" ? <button className='highlight-btn px-14px py-10px h-32px d-flex-center '>Pending Users</button> : 
                    <p onClick={()=>setActiveSection("Pending")} className='color-grey-500 fs-13px fw-700 px-14px py-10px cursor'>Pending Users</p>}
                </div>
                <button onClick={()=>setShowInviteUsers(prev => !prev)} className='primary-btn px-12px py-10px br-6px d-flex-center'>
                <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                Invite User
                </button>
            </div>
           {loading ? <Loader />
           : (activeSection === "Active" ? <ActiveUsers /> : <PendingUsers />)}
          

            {showInviteUsers && 
            <CenterModal children={<InviteUsers callback={() => {
                setLoading(true)
                setTimeout(() => {
                    setLoading(false)
                }, 500);
            }} handleClose={()=>setShowInviteUsers(false)} />} />}
           
        </div>
    );
};

export default Users;