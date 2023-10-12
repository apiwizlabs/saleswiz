import React, { useState, useEffect } from 'react';
import { TeamAPI, UserAPI } from '../../../api/apiConfig';
import Select, {components} from 'react-select';
import { capitalizeFirstLetters } from '../../../utils';
import { Loader } from '../../../components/Loader';
import {ADMIN_ROLES, ADMIN_SALES} from "../../../utils/constants"
import { useOutletContext } from 'react-router';

const EditTeamForm = ({teamId, updateTeamClick, setUpdateTeamClick, setTeamsData, handleClose }) => {
    const [teamData, setTeamData] = useState(null);
    const [activeSection, setActiveSection] = useState('Members');
    const [allUsersData, setAllUsersData] = useState(null);
    const [addMemberModal, setAddMemberModal] = useState(false);
    const [chosenMember, setChosenMember] = useState(false);
    const [chosenMemberError, setChosenMemberError] = useState(false);
    const [customerData, setCustomerData] = useState([])
    const [membersError, setMembersError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();


    const CustomOptionItem = ({ children, ...props }) => {
        return (
        <components.Option  {...props}>
          <p>{children.firstName}</p>
          <p className='color-grey-500 fs-14px '>{capitalizeFirstLetters(children.role.split("_").join(" "))}</p>
        </components.Option>
    )};

    const CustomSingleValue = ({ children, ...props }) => {
        console.log(children, "CHILDRENN ");
        return ( <components.SingleValue  {...props}>
          <p>{children.firstName}</p>
        </components.SingleValue>
      )};

      const customStyles = {
        option: (provided, state) => ({
          ...provided,
          display: "flex",
          justifyContent: "space-between",
        }),
        control: (baseStyles, state) => ({
            ...baseStyles,
            backgroundColor: chosenMemberError ? 'var(--error-50)' : 'transparent',
            borderColor: chosenMemberError ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
        }),
      };


    useEffect(()=>{
        if(updateTeamClick){
            const members = teamData.members.map(team => team._id);
            const roles = teamData.members.map(team => team.role);

            if(!(roles.includes("ACCOUNT_OWNER") && roles.includes("SALES_OWNER"))){
                setMembersError("Atleast one Sales Owner and Account Owner is Required");
                setUpdateTeamClick(false)
                return;
            }
            console.log(teamData, "CHROMIUMMM", members);
            (async ()=>{
                try{
                    console.log(teamData, "Team Data");
                    const teamUpdated = await TeamAPI.updateTeam(teamId?.id, {members})
                    if(teamUpdated?.status === 200){
                        const allTeamsData = await TeamAPI.getAllTeams()
                        if(allTeamsData?.status  === 200){
                            setTeamsData(allTeamsData.data.data);
                            handleClose()
                        }
                    }
                    setUpdateTeamClick(false);

                }catch(err){
                    console.error(err)
                    setUpdateTeamClick(false);
                    handleClose()
                }
            })()
            setUpdateTeamClick(false);
        }

    },[updateTeamClick])
      
      

    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const allUsersData = await UserAPI.getAllUsers();
                const teamData = await TeamAPI.getTeamById(teamId?.id);
                if(teamData.status === 200){
                    console.log(teamData, "TEAM DATA")
                    setTeamData(teamData.data.data);
                    setCustomerData(teamData.data.relatedCustomers.map(customer => customer.userValues.find(userValue => userValue.labelName === "Customer Name")?.fieldValue || "[Customer Name]"))
                }
                if(allUsersData.status === 200){
                    setAllUsersData(allUsersData.data.data.users);
                }
                setLoading(false)
                // console.log(allUsersData.data.data.users, " :: team data members :: ",teamData.data.data.members);

            }catch(err){
                setLoading(false)
                console.error(err)
            }    
        })()
    }, [])

    return (
        <div className='px-20px py-16px w-100 h-100'>

            <div className='d-flex transparent-divider mb-20px'>
                <div onClick={()=>setActiveSection("Members")} className={`px-24px py-8px cursor ${activeSection === 'Members' ? 'active-border-bottom active-text' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Members</p>
                </div>
                <div onClick={()=>setActiveSection("Deals")} className={`px-24px py-8px cursor ${activeSection === 'Deals' ? 'active-border-bottom active-text' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Customers</p>
                </div>
            </div>
           {loading ? <Loader /> : activeSection === "Members" ? 
            <div className='d-flex flex-column'>
                <p className='fs-16px fw-500 color-grey-900 mb-10px'>Team Members</p>
                {ADMIN_SALES.includes(currentUserData?.userRole) && !addMemberModal && <button onClick={()=>{
                    setAddMemberModal(true)
                }} className='secondary-btn w-100 h-40px d-flex-center color-grey-700 fs-14px fw-700 cursor mt-8px mb-12px'>Add Members</button>}
                {addMemberModal && 
                    <div className='w-100 h-174px add-member-section position-relative'>
                  <div className=' d-absolute-center bg-white h-166px br-6px w-406px p-16px mb-16px'>
                      <label className='fw-500 mb-6px' htmlFor='email'>Member Name</label>
                     {(allUsersData && teamData) && 
                     <Select
                        onChange={(chosenOption)=>{
                            console.log(chosenOption, "CHOSEN OPT");
                            const {label , value} = chosenOption
                            setChosenMember({firstName: label.firstName, lastName: label.lastName, _id: value, role: label.role})
                        }}
                        styles={customStyles}
                        className="custom-form-select mb-20px"
                        classNamePrefix="select"
                        isSearchable={true}
                        components={{
                            IndicatorSeparator: () => null,
                            Option: CustomOptionItem,
                            SingleValue: CustomSingleValue,
                        }}
                        name="users"
                        placeholder="Select Member"
                        options={allUsersData.filter(user => {
                            if(ADMIN_ROLES.includes(user?.role)) return false
                            return !teamData.members.map(member => member._id).includes(user._id)
                        }).map(item => ({value: item._id, label: {firstName: item.firstName, lastName: item.lastName, role: item.role}}))}
                    />}

                    {console.log(`allUsersData`, allUsersData)}
                      <div className='d-flex gap-12px'>
                          <button onClick={()=>{setAddMemberModal(false)}} className='secondary-btn h-40px flex-1 d-flex-center'>
                              Cancel
                          </button>
                          <button onClick={()=>{
                            if(chosenMember){
                                setTeamData(prev => ({...prev, members: [...prev.members, chosenMember]}))
                                setAddMemberModal(false)
                            }else{
                                setChosenMemberError(true)
                            }
                          }} className='primary-btn h-40px flex-1'>
                              Add
                          </button>
                      </div>
                  </div>
                 
                    </div>
                }
                {membersError && <p className='text-center error-txt'>{membersError}</p>}
                {teamData && teamData.members.length > 0 ? teamData.members.map(user =>                 
                <UserCard key={user._id} user={user} setTeamData={setTeamData} teamData={teamData} />
                ) : <p>No Members Yet</p>} 
            </div> : 
            <div className='d-flex flex-column'>
                <p className='fs-16px fw-500 color-grey-900 mb-8px'>Related Customers</p>
                {customerData && customerData.length > 0  ? 
                customerData.map((customer)=>{
                    return (<p className='fs-14px color-grey-900 mb-4px py-9px'>{customer}</p>)
                }): <p>No Customers Yet</p>}
                
                {/* <p className='fs-14px color-grey-900 mb-4px py-9px'>MTN</p> */}

            </div>}
        </div>
    );
};

const UserCard = ({user, setTeamData, teamData}) => {
    const [activeItem, setActiveItem] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();


    return (
        <div
        onMouseEnter={() =>{
            if(ADMIN_SALES.includes(currentUserData?.userRole)){
                setActiveItem(true);
            }
        }}
        onMouseLeave={() => {
            if(ADMIN_SALES.includes(currentUserData?.userRole)){
                setActiveItem(false)
            }
        }}
        className={`d-flex justify-content-between h-46px py-10px px-8px align-items-center br-6px ${ADMIN_SALES.includes(currentUserData?.userRole) ? 'hover-grey-50' : ''}`}>
          <p className='fs-16px fw-500 color-grey-900'>{user?.firstName + " " + user?.lastName}</p>
          <div className='d-flex align-items-center'>
          <p className='fs-14px color-grey-400 pr-8px'>{capitalizeFirstLetters(user?.role.split("_").join(" "))}</p>
          {activeItem && <i onClick={()=>{
            const _teamData = teamData.members.filter(member => member._id !== user._id)
            setTeamData(prev => ({...prev, members: _teamData}))
          }} className="ri-delete-bin-5-line fs-20px lh-20px color-error-red ml-6px cursor"></i>}          
        </div>

      </div>
    )
}

export default EditTeamForm;