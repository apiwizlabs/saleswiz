import React from 'react';
import { useState } from 'react';
import Teams from './Teams';
import Users from './Users';
import { useOutletContext } from 'react-router-dom';
import { ADMIN_ROLES } from '../../../utils/constants';

const TeamUserMgmt = () => {
    const [activeSection, setActiveSection] = useState('Teams');
    const [currentUserData, setCurrentUserData] = useOutletContext();

    return (
        <div >
            {/* <h1>Team Page</h1> */}
           {ADMIN_ROLES.includes(currentUserData?.userRole) && <div className='d-flex grey-divider mt-16px'>
                <div onClick={()=>setActiveSection("Teams")} className={`px-24px py-8px cursor ${activeSection === 'Teams' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Teams</p>
                </div>
                <div onClick={()=>{
                        setActiveSection("Users");
                    }} className={`px-24px py-8px cursor ${activeSection === 'Users' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Users</p>
                </div>
            </div>}
            {activeSection === 'Teams' ?
            <Teams />:
            <Users />
            }
          
        </div>
    );
};

export default TeamUserMgmt;