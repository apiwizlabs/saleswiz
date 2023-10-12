import React, {useEffect, useState} from 'react';
import Select, { components } from 'react-select';
import { UserAPI, TeamAPI } from '../../../api/apiConfig';
import { Loader } from '../../../components/Loader';
import { capitalizeFirstLetters } from '../../../utils';

const CreateTeamForm = ({handleModalClose, setTeamsData}) => {

    const SALES_ROLES = ["SALES_OWNER", "ACCOUNT_OWNER", "ADMIN", "ORG_OWNER"]
    const [teamInputData, setTeamInputData] = useState({
        teamName: "",
        salesOwner: "",
        accountOwner: "",
        teamMembers: "",
    });
    const [teamError, setTeamError] = useState({})
    const [allUsersData, setAllUsersData] = useState(null);
    const [loading, setLoading] = useState(false);

    const MultiValueContainer = props => {
        return null;
    };

    const handleTeamInputData = (name, value) => {
        setTeamInputData(prev => ({...prev, [name] : value}))
    }

    const validate = (values) => {
        const errors = {}
      if(!values.teamName){
        errors.teamName = "Team Name is required"
      }
      if(!values.salesOwner){
        errors.salesOwner = "Sales Owner is required"
      }
      if(!values.accountOwner){
        errors.accountOwner = "Account Owner is required"
      }
      return errors;
    }

    const handleCreateTeam = async () => {
        const errors = validate(teamInputData);
        console.log(errors, "ERRORS", teamInputData);
        setTeamError(errors);
        if(Object.keys(errors).length > 0){
          return;
        }
        try{
            setLoading(true)
            console.log("its successfule :: ",teamInputData);
            const teamMembers = teamInputData?.members?.map(member => member.value)
            const formattedTeamData = teamMembers?.length > 0 ? {teamName: teamInputData.teamName, members: [teamInputData?.salesOwner, teamInputData?.accountOwner, ...teamMembers]} : {teamName: teamInputData.teamName, members: [teamInputData?.salesOwner, teamInputData?.accountOwner]}
            console.log("Formatted team data ", formattedTeamData);
            const teamCreated = await TeamAPI.createTeam(formattedTeamData);
            if(teamCreated.status === 200){
               const allTeamsData = await TeamAPI.getAllTeams()
                if(allTeamsData.status === 200){
                    setTeamsData(allTeamsData.data.data);
                    handleModalClose()
                }
            }
            setLoading(false)
        }catch(err){
          handleModalClose()
          console.error(err, "::ERROR")      
        }
    }

  
    useEffect(()=>{
        (async ()=>{
            setLoading(true)
            try{
                const allUsersData = await UserAPI.getAllUsers();
                if(allUsersData.status === 200){
                    setAllUsersData(allUsersData?.data?.data?.users);
                    setLoading(false)
                }
                // console.log(allUsersData.data.data.users, " :: team data members :: ",teamData.data.data.members);
                setLoading(false)

            }catch(err){
                console.error(err)
                setLoading(false)
            }    
        })()
    }, [])



    return (
        <>
        {console.log(allUsersData, "ALL USERS DATA")}
         <div className='modal-header-1 mx-25px mt-25px'>
                <div className='d-flex justify-content-between'>
                    <p className='fs-18px fw-700 lh-28px'>Create Team</p>
                    <p><i onClick={handleModalClose} className="ri-close-line fs-24px lh-24px cursor"></i></p>
                </div>
                <p className='color-grey-600 fs-14px'>Create your team to assign it to any deal.</p>
            </div>
           {loading ? <Loader /> : allUsersData?.length > 0 ?
            <div className='d-flex flex-column justify-content-center p-20px'>
                <label className='fw-500 mb-6px' htmlFor='name'>Team Name</label>
                <input 
                onChange={(e)=>handleTeamInputData("teamName", e.target.value)}
                className={`h-40px py-8px px-12px br-6px input-styles ${teamError.teamName ? 'error-input' : ''}`} 
                id="name" name="teamName"  placeholder={'Type Team Name'} type='text'/>
                {teamError?.teamName && <p className='error-txt'>{teamError.teamName}</p>}
                <label className='fw-500 mb-6px mt-20px' htmlFor='name'>Sales Owner</label>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    isSearchable={true}
                    components={{
                        IndicatorSeparator: () => null
                        }}
                    onChange={(chosenOption)=>{
                        handleTeamInputData("salesOwner", chosenOption.value)
                    }}
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: teamError?.salesOwner ? 'var(--error-50)' : 'transparent',
                            borderColor: teamError?.salesOwner ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 61 }),
                    }}
                    name="salesOwner"
                    placeholder="Select Sales Owner"
                    options={
                        allUsersData.filter(user => user.role === "SALES_OWNER" ).map(user => ({label: user.firstName, value: user._id}))
                    }
                />      
                {teamError.salesOwner && <p className='error-txt'>{teamError.salesOwner}</p>}              
                <label className='fw-500 mb-6px mt-20px' htmlFor='name'>Account Owner</label>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    components={{
                    IndicatorSeparator: () => null
                    }}
                    onChange={(chosenOption)=>{
                        handleTeamInputData("accountOwner", chosenOption.value)
                    }}
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: teamError?.accountOwner ? 'var(--error-50)' : 'transparent',
                            borderColor: teamError?.accountOwner ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 61 }),
                    }}
                    isSearchable={true}
                    name="accountOwner"
                    placeholder="Select Account Owner"
                    options={allUsersData.filter(user => user.role === "ACCOUNT_OWNER" ).map(user => ({label: user.firstName, value: user._id}))}
                />  
                {teamError.accountOwner && <p className='error-txt'>{teamError.accountOwner}</p>}                            
                <label className='fw-500 mb-6px mt-20px' htmlFor='name'>Team Members</label>
                <Select
                    value={teamInputData.teamMembers}
                    isMulti
                    isClearable={false}
                    name="linkedTickets"
                    components={{ 
                        MultiValueContainer, 
                        IndicatorSeparator: () => null
                    }}
                    onChange={(chosenOptions)=> {
                        console.log(chosenOptions, "CHOSEN TM");
                        setTeamInputData(prev => ({...prev, teamMembers: chosenOptions}))
                        handleTeamInputData("members", chosenOptions)
                    }}
                    styles={{
                        multiValue: (base) => ({
                        ...base,
                        margin: 0,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        }),
                    }}
                    options={allUsersData.filter(user => !SALES_ROLES.includes(user.role)).map(user => ({label: user.firstName, value: user._id, role: user.role}))}
                    placeholder="Select Team Members"
                    className="basic-multi-select"
                    classNamePrefix="select"
                    />
                    
                    {teamInputData?.teamMembers?.length > 0 && 
                <div className='d-flex gap-6px mt-6px'>
                {teamInputData?.teamMembers.map(member => {
                    return (
                        <div className='d-flex multi-item gap-8px'>
                            <p className='fs-14px color-grey-700 fw-500'>{member.label}</p>
                            <p className='fs-14px color-grey-500 fw-500'>{capitalizeFirstLetters(member.role.split("_").join(" "))}</p>
                            <i onClick={()=>{setTeamInputData(prev => ({...prev, teamMembers: prev.teamMembers.filter(item => item.value !== member.value)}))}} class="ri-close-line fs-12px p-2px lh-16px"></i>
                        </div>
                    )
                })}
                
                </div>}
                <div className='d-flex justify-content-center gap-12px mt-32px'>
                <button className='secondary-btn py-10px px-16px w-201px d-flex-center'>Cancel</button>
                <button onClick={handleCreateTeam} className='primary-btn w-201px'>Confirm</button>
                </div>
            </div> : <p>No Users Yet</p>  }
            
        </>
    );
};

export default CreateTeamForm;