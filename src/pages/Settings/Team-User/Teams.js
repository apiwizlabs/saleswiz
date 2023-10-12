import React, { useEffect, useState, useRef } from 'react';
import CenterModal from '../../../components/Modals/CenterModal';
import { TeamAPI } from '../../../api/apiConfig';
import {Loader} from "../../../components/Loader";
import moment from "moment";
import CreateTeamForm from './CreateTeamForm';
import EditTeamForm from './EditTeamForm';
import SideModal from '../../../components/Modals/SideModal';
import { useOutletContext } from 'react-router-dom';
import { ADMIN_SALES, ADMIN_ROLES, SALES_OWNER } from '../../../utils/constants';
import {toast} from 'react-toastify';
import useOutsideClick from "../../../utils/useOutsideClick"

const Teams = () => {
    const [showCreateTeam, setShowCreateTeam ] = useState(false);
    const [loading, setLoading] = useState(false);
    const [teamsData, setTeamsData] = useState(null);
    const [toggleEditModal, setToggleEditModal] = useState(false);
    const [teamId, setTeamId] = useState({id: null, name: ""});
    const [updateTeamClick, setUpdateTeamClick] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const allTeamsData = await TeamAPI.getAllTeams()
                setTeamsData(allTeamsData.data.data);
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])
    
    return (
        <div className='p-16px'>
            {ADMIN_SALES.includes(currentUserData?.userRole) && <div className='d-flex justify-content-end'>
                <button onClick={()=>setShowCreateTeam(prev => !prev)} className='primary-btn px-12px py-10px br-6px d-flex-center'>
                <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                Create Team
                </button>
            </div>}
              <div className='mt-17px'>
               {loading ? <Loader /> : 
              teamsData?.length > 0 ? 
               <table>
                    <tr>
                        <th className='fs-14px fw-400 color-grey-600'>Team Name</th>
                        <th className='fs-14px fw-400 color-grey-600'>No of Customers</th>
                        <th className='fs-14px fw-400 color-grey-600'>Team Members</th>
                        <th className='fs-14px fw-400 color-grey-600'>Modified time</th>
                    </tr>
                    {teamsData.map(team => {
                        return (
                            <TableRow team={team} setToggleEditModal={setToggleEditModal} setTeamId={setTeamId} setTeamsData={setTeamsData} setLoading={setLoading}  />
                        )
                    })}
                </table> : <p className='text-center'>No Items Yet</p>
                }
              </div>
            {showCreateTeam && <CenterModal children={<CreateTeamForm setTeamsData={setTeamsData} handleModalClose={()=>setShowCreateTeam(false)} />}/>}
            {toggleEditModal && <SideModal  
            modalType={"EDIT"}
            heading={`${teamId?.name}`} 
            noFooter={ADMIN_SALES.includes(currentUserData?.userRole) ? false : true}
            onSubmit={()=>{
                console.log("submitting");
                setUpdateTeamClick(true);
            }} 
            onClose={()=>{
                setToggleEditModal(false);
            }}  
            children={<EditTeamForm setTeamsData={setTeamsData} handleClose={()=>{setToggleEditModal(false)}} teamId={teamId} setUpdateTeamClick={setUpdateTeamClick} updateTeamClick={updateTeamClick} />}/>}
        </div>
    );
};

const TableRow = ({team, setTeamId, setToggleEditModal, setTeamsData, setLoading}) => {
    const [currentUserData, setCurrentUserData] = useOutletContext();
    console.log(currentUserData, "URRENT USER DATA");

    const [showDropdown, setShowDropdown] = useState(false);
    const [activeRow, setActiveRow] = useState(false);
    const dropdownRef = useRef(null);

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)
    })

    const handleDeleteTeam = async (teamId) => {
        try{
            setLoading(true)
           const deletedTeam = await TeamAPI.deleteTeam(teamId)
           if(deletedTeam.status === 200){
                const allTeamsData = await TeamAPI.getAllTeams();
                setTeamsData(allTeamsData.data.data);
                setLoading(false);
                toast.success("Team has been deleted");
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }


    return (
        <tr 
            onMouseEnter={()=>{setActiveRow(true)}} 
            onMouseLeave={()=>{
                if(!showDropdown){ setActiveRow(false)}
            }}
        >
            <td>{team?.teamName}</td>
            <td>{team?.customers?.length || 0}</td>
            <td>
                <div className='d-flex align-items-center justify-content-between'>
                    {team?.members?.length || 0} 
                   {activeRow && <div onClick={()=>{
                     setTeamId({name: team?.teamName , id: team._id})
                    setToggleEditModal(prev => !prev);}} className='icon-link-btn d-flex-center cursor'>
                        <i class="ri-external-link-fill"></i>
                    </div>}
                </div>
            </td>
            <td className='position-relative'>
                <div className='d-flex h-100 justify-content-between '>
                {moment(team.mts).format('MMM DD, YYYY hh:mm A')}

                { activeRow && (ADMIN_ROLES.includes(currentUserData?.userRole) || 
                (SALES_OWNER.includes(currentUserData?.userRole) && team?.members?.find(user => user._id == currentUserData?.userId)) ) && 
                <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary display-on-parent'>
                    <i onClick={()=>{
                        setToggleEditModal(prev => !prev);
                        setTeamId({name: team?.teamName , id: team._id})
                    }} className="ri-pencil-line fs-14px lh-14px px-8px py-11px cursor"></i>
                    {ADMIN_ROLES.includes(currentUserData?.userRole) && <div className='position-relative'>
                        <i onClick={()=>{
                            setShowDropdown(true);
                        }} className="ri-more-2-line fs-20px lh-20px px-8px py-11px cursor"> </i>
                        {showDropdown && (<div ref={dropdownRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                            <p onClick={()=>{handleDeleteTeam(team._id)}} className='table-dropdown-item'>Delete Team</p>
                        </div>)}
                    </div>}
                </div>}
                </div>
              
            </td>
        </tr>
    )
}


export default Teams;