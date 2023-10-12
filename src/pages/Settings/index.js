import React, { useState } from 'react';
import {Outlet} from 'react-router-dom'
import CurrencyIcon from '../../assets/icons/currency.svg'
import FieldIcon from '../../assets/icons/fields.svg'
import { useNavigate, useLocation, useOutletContext } from 'react-router';
import { SALES_OWNER, ADMIN_ROLES } from '../../utils/constants';

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUserData , setCurrentUserData] = useOutletContext();
    const [activeSettingPage, setActiveSettingPage] = useState(location.pathname)

    const settingsSidebarData = ADMIN_ROLES.includes(currentUserData?.userRole) ? [
        {
            title: 'Profile Section',
            route: '/profile', 
            iconName: 'ri-user-line'
        },
        {
            title: 'Teams and User',
            route: '/teams',
            iconName: 'ri-team-line'
        },
        {
            title: 'Fields',
            route: '/fields',
            iconSrc: FieldIcon
        },
        {
            title: 'Approval Manager',
            route: '/approvals',
            iconName: 'ri-auction-line'
        },
        {
            title: 'Currency Settings',
            route: '/currency',
            iconSrc: CurrencyIcon
        },
    ] : SALES_OWNER.includes(currentUserData?.userRole) ? [
        {
            title: 'Profile Section',
            route: '/profile', 
            iconName: 'ri-user-line'
        },
        {
            title: 'Teams and User',
            route: '/teams',
            iconName: 'ri-team-line'
        },
        {
            title: 'Approval Manager',
            route: '/approvals',
            iconName: 'ri-auction-line'
        },
        {
            title: 'Currency Settings',
            route: '/currency',
            iconSrc: CurrencyIcon
        },
    ] : [
        {
            title: 'Profile Section',
            route: '/profile', 
            iconName: 'ri-user-line'
        },
        {
            title: 'Teams and User',
            route: '/teams',
            iconName: 'ri-team-line'
        },
        {
            title: 'Currency Settings',
            route: '/currency',
            iconSrc: CurrencyIcon
        },
    ] 
    return (
        <div className='grid-wrapper w-100 h-100'>
            <div className='settings-sidebar p-16px d-flex flex-column w-193px h-100 position-fixed grid-col-1'>
                {settingsSidebarData.map((sidebarItem)=>{
                    return(
                        <div onClick={()=>{
                            setActiveSettingPage(sidebarItem.route)
                            navigate(sidebarItem.route)
                        }} className={`d-flex align-items-center gap-8px p-8px h-36px w-161px mb-8px br-4px settings-sidebar-item cursor ${sidebarItem.route === activeSettingPage ? 'bg-grey-200' : ''}`}>
                            {sidebarItem?.iconName ? <i className={`${sidebarItem.iconName} fs-20px color-grey-700 lh-20px`}></i> : 
                            <img alt={`${sidebarItem.title} logo`} src={sidebarItem.iconSrc} />}
                            <p className='fs-14px lh-20px color-grey-900'>{sidebarItem.title}</p>
                        </div>
                    )
                })}
            </div>
            <div className='w-100 h-100 grid-col-2'>
                <Outlet context={[currentUserData, setCurrentUserData]} /> 
            </div>
        </div>
    );
};

export default Settings;