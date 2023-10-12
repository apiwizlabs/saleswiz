import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ContactsAPI, TemplateAPI, UserAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import NewContactForm from './NewContactForm';
import { useNavigate } from 'react-router';
import SideModal from '../../components/Modals/SideModal';
import {toast} from 'react-toastify';
import useOutsideClick from '../../utils/useOutsideClick';
import ContactTimeline from "./ContactTimeline";
import { ACTIVE_ROLES, ADMIN_ROLES } from '../../utils/constants';
import { useOutletContext } from 'react-router';

const ContactOverview = () => {
    const {contactId} = useParams();
    const [overviewData, setOverviewData] = useState(null)
    const [currentUserData, setCUrrentUserData] = useOutletContext();
    const [toggleGeneral, setToggleGeneral] = useState(true);
    const [toggleAdditional, setToggleAdditional] = useState(true);
    const [toggleDescription, setToggleDescription] = useState(true);
    const [toggleDeals, setToggleDeals] = useState(true);
    const [loading, setLoading] = useState(false);
    const [toggleEdit, setToggleEdit] = useState(false);
    const [submitContact, setSubmitContact] = useState(false);
    const [toggleDelete, setToggleDelete] = useState(false);
    const navigate = useNavigate();
    const tabs = ["Overview", "Timeline"];
    const [activeSection, setActiveSection] = useState('Overview');
    const [allUsersData, setAllUsersData] = useState([]);

const getContactData = async () => {
    try{
        setLoading(true)
        const contactApiData = await ContactsAPI.getContactById(contactId);
        const allUsers = await UserAPI.getAllUsers()
        if(allUsers?.status === 200){
            console.log(allUsers?.data?.data?.users, "USERS DATA");
            setAllUsersData(allUsers?.data?.data?.users.map(item => ({id: item._id, name: item?.firstName+" "+item?.lastName})))
        }
        if(contactApiData.status === 200){
            console.log(contactApiData?.data?.data, "CONTACT GET SINGLE");
            setOverviewData(contactApiData?.data?.data)
        }
        setLoading(false)

    }catch(err){
        setLoading(false)
        console.error(err)
    }
}
    useEffect(()=>{
        if(contactId){
            getContactData();
        }
    },[contactId])

    // useEffect(()=>{
    //    getContactData()
    // },[])

    const deleteRef = useRef(null);
     const handleDeleteContact = async (contactId) => {
        try{
            setLoading(true)
           const deletedTeam = await ContactsAPI.deleteContact(contactId)
           if(deletedTeam.status === 200){
               navigate("/contacts")
                toast.success("Contact has been deleted");
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    useOutsideClick(deleteRef, ()=>{
        setToggleDelete(false);
    })

    return (
        <div className='w-100 h-100 p-16px'>
            {loading ? <Loader /> :
            overviewData?.userValues?.length > 0 
            ? <>
            <div className='d-flex justify-content-between align-items-center'>
                <div className='d-flex align-items-center gap-12px'>
                    <i onClick={()=>navigate("/contacts")} className="ri-arrow-left-line fs-24px lh-24px cursor"></i>
                    <p className='color-grey-900 fw-500 fs-24px'>{overviewData.userValues.find(item => item.labelName === "Contact Name")?.fieldValue}</p>
                </div>
                <div className='d-flex gap-12px align-items-center mr-4px position-relative'>
                    {ACTIVE_ROLES.includes(currentUserData?.userRole) && <div onClick={()=>setToggleEdit(true)} className='grey-box cursor'><i className="ri-pencil-line fs-16px lh-16px"></i></div>}
                    {ADMIN_ROLES.includes(currentUserData?.userRole) && <i onClick={()=>{setToggleDelete(prev => !prev)}} className="ri-more-2-fill cursor"></i>}
                    {toggleDelete && <div ref={deleteRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                        <p onClick={(e)=>{
                            setToggleDelete(false)
                            handleDeleteContact(contactId)}} className='table-dropdown-item'>Delete Contact</p>
                    </div>}
                </div>
            </div>
            <div className='d-flex grey-divider pt-8px px-12px grey-border-top mt-20px'>
                {tabs.map(tab => {
                    return (
                        <div onClick={()=>setActiveSection(tab)} className={`px-24px py-8px cursor ${activeSection === tab ? 'active-border-bottom' : ''}`}>
                            <p className={`fs-14px color-grey-700`}>{tab}</p>
                        </div>
                    )
                })}
            </div>
            <div className='w-100 h-100 bg-grey-200 p-16px d-flex-center'>
                {activeSection==="Overview" ? <div className='bg-white w-100 h-100 br-6px px-24px py-16px'>
                    <p className='color-grey-900 fs-16px fw-700 '>Overview</p>
                    <div className='info-box p-16px d-flex gap-24px mt-8px'>
                        <div className='d-flex flex-column w-283px'>
                            <div onClick={()=>{setToggleGeneral(prev => !prev)}} className='d-flex cursor justify-content-between align-items-center mb-8px'>
                                <p className='color-grey-900 fs-16px fw-500'>General Info</p>
                                {toggleGeneral ? <i class="ri-arrow-down-s-line fs-20px lh-20px mr-4px"></i> : <i class="ri-arrow-up-s-line fs-20px lh-20px mr-4px"></i> }
                            </div>
                           {toggleGeneral && <div className='d-flex flex-column gap-10px'>
                                {overviewData?.userValues?.map(userValue => {
                                    if(userValue?.labelName === "Contact Name" || userValue?.labelName === "Description" || userValue?.templateFieldId?.isTechnicalInfo){
                                        return null
                                    }
                                    if(userValue?.templateFieldId?.fieldType === "Currency" && (!userValue[0] || !userValue[1])){
                                        return null
                                    }

                                    return (
                                    <div><p className='color-grey-500 fs-12px'>{userValue?.labelName}</p>
                                                           {allUsersData && 
                        <p className='color-grey-900 fs-14px fw-500'>{userValue?.templateFieldId?.fieldType === "Users" ? 
                                allUsersData?.find(item => item.id == userValue?.fieldValue)?.name : typeof userValue?.fieldValue === "object" && (userValue?.templateFieldId?.fieldType === "Phone" || userValue?.templateFieldId?.fieldType === "Currency" ) ? userValue?.fieldValue[0] : typeof userValue?.fieldValue === "object" ? userValue?.fieldValue?.join(" ,") : userValue?.fieldValue}</p>}
                                    </div>)
                                })}
                            </div>}
                        </div>
                        <div className='d-flex flex-column w-283px'>
                            <div onClick={()=>setToggleAdditional(prev => !prev)} className='d-flex cursor justify-content-between align-items-center mb-8px'>
                                <p className='color-grey-900 fs-16px fw-500'>Additional Info</p>
                                {toggleAdditional ? <i class="ri-arrow-down-s-line fs-20px lh-20px mr-4px"></i> : <i class="ri-arrow-up-s-line fs-20px lh-20px mr-4px"></i>}
                            </div>
                            {toggleAdditional && <div className='d-flex flex-column gap-10px'>
                                {overviewData?.userValues?.filter(userValue => !userValue?.templateFieldId?.isDefault).length > 0 ?
                                 overviewData?.userValues?.map(userValue => {
                                    if(userValue?.labelName === "Contact Name" || userValue?.labelName === "Description" || userValue?.templateFieldId?.isDefault){
                                        return null
                                    }
                                    if(userValue?.templateFieldId?.fieldType === "Currency" && (!userValue[0] || !userValue[1])){
                                        return null
                                    }

                                    return (
                                        <div><p className='color-grey-500 fs-12px'>{userValue?.labelName}</p>
                                                               {allUsersData && 
                        <p className='color-grey-900 fs-14px fw-500'>{userValue?.templateFieldId?.fieldType === "Users" ? 
                                allUsersData?.find(item => item.id == userValue?.fieldValue)?.name : typeof userValue?.fieldValue === "object" && (userValue?.templateFieldId?.fieldType === "Phone" || userValue?.templateFieldId?.fieldType === "Currency" ) ? userValue?.fieldValue[0] : typeof userValue?.fieldValue === "object" ? userValue?.fieldValue?.join(" ,") : userValue?.fieldValue}</p>}
                                        </div>
                                    )
                                }) : <p>No Info Yet</p> }
                            </div>}
                        </div>
                        <div className='d-flex flex-column w-283px'>
                            <div onClick={()=>setToggleDescription(prev => !prev)} className='d-flex cursor justify-content-between align-items-center mb-8px'>
                                <p className='color-grey-900 fs-16px fw-500'>Description</p>
                                { !toggleDescription ? 
                                <i className="ri-arrow-up-s-line fs-20px lh-20px mr-4px"></i> : 
                                <i className="ri-arrow-down-s-line fs-20px lh-20px mr-4px"></i>}
                            </div>
                            {toggleDescription && <div className='d-flex flex-column gap-23px'>
                                {overviewData?.userValues?.filter(userValue => userValue?.labelName === "Description").length > 0 ?
                                 overviewData?.userValues?.map(userValue => {
                                    if(userValue?.labelName !== "Description"){
                                        return null
                                    }
                                    return <p className='color-grey-900 fs-14px fw-500'>{userValue.fieldValue}</p>
                                }) : <p>No Description Yet</p>}
                            </div>}
                        </div>
                        <div className='d-flex flex-column w-283px'>
                            <div onClick={()=>setToggleDeals(prev => !prev)} className='d-flex cursor justify-content-between align-items-center mb-8px'>
                                <p className='color-grey-900 fs-16px fw-500'>Related Deals</p>
                                { !toggleDeals ? 
                                <i className="ri-arrow-up-s-line fs-20px lh-20px mr-4px"></i> : 
                                <i className="ri-arrow-down-s-line fs-20px lh-20px mr-4px"></i>}
                            </div>
                            {toggleDeals && <div className='d-flex flex-column gap-23px'>
                                {overviewData?.linkedCustomer?.deals?.length > 0 ? 
                                overviewData?.linkedCustomer?.deals?.map(deal => {
                                    return <p className='color-grey-900 fs-14px fw-500'>{deal?.userValues?.find(userValue => userValue?.labelName === "Deal Name")?.fieldValue}</p>
                                }) : <p>No Deals Yet</p>}
                            </div>}
                        </div>
                    </div>

                </div> : <ContactTimeline overviewData={overviewData}/>
                }
            </div>
            {toggleEdit && <SideModal 
            modalType={"EDIT"}
            heading="Edit Contact"   
            onSubmit={()=>{
                setSubmitContact(true);
            }}  
            onClose={()=>{
                setToggleEdit(false);
                setSubmitContact(false);
            }}  
            children={<NewContactForm contactId={contactId} setOverviewData={setOverviewData} submitContact={submitContact} setSubmitContact={setSubmitContact}  handleModalClose={()=>setToggleEdit(false)}  />} />}
            
            </> : <p>No Data Entered Yet</p>}
           
        </div>
    );
};

export default ContactOverview;