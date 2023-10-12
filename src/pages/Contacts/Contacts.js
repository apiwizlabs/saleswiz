import React, { useEffect, useState, useRef, forwardRef} from 'react';
import { ContactsAPI, TeamAPI, LeadsAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import useOutsideClick from '../../utils/useOutsideClick';
import SideModal from '../../components/Modals/SideModal';
import NewContactForm from './NewContactForm';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { ACTIVE_ROLES, TEAM_LEADS, ADMIN_ROLES } from '../../utils/constants';
import { useNavigate } from 'react-router';
import {extractContacts} from "../../utils/index"
import Select from 'react-select';
import DatePicker from "react-datepicker";
import {countKeysWithDifferentValues } from '../../utils';
import Pagination from '../../components/Pagination';
import { PageSize } from '../../utils/constants';

const Contacts = () => {
    const [contactsData, setContactsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editToggleModal , setEditToggleModal] = useState(false);
    const [contactId, setContactId] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [submitContact, setSubmitContact] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext(null);
    const [toggleFilterModal, setToggleFilterModal] = useState(false);
    const [leadsOptions, setLeadsOptions] = useState([]);
    const [teamsOptions, setTeamsOptions] = useState([]);
    const initialFilterData = {customersIdList: [], teamsIdList: [], dateFrom:"", dateTo: "", pageSize: PageSize, currentPage: 1}
    const initDateDetails = {dateFrom : "", dateTo: ""};
    const [filterData, setFilterData] = useState(initialFilterData)   
    const [dateDetails, setDateDetails] = useState(initDateDetails);
    const inputRef = useRef(null);
    const inputRef2 = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilterCount, setActiveFiltersCount] = useState("");

    const MultiValueContainer = props => {
        return null;
    };

    
    const getFilterData = async () => {
        try{
            setLoading(true)
            const teamsData = await TeamAPI.getAllTeams();
            const customersData = await LeadsAPI.getAllCustomers();
            if(customersData?.status === 200){
                setLeadsOptions(customersData?.data?.data.map(item => ({
                        label: item.userValues.find(userValue => userValue.labelName === "Customer Name")?.fieldValue, 
                        value: item._id
                    })));
            } 
            if(teamsData?.status === 200){
                setTeamsOptions(teamsData.data.data.map(team => ({label: team?.teamName, value: team._id})));
            }
            console.log("DATA BUnCH ::  ",teamsData, customersData)

            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const getContactsData = async () => {
        try{
            setLoading(true)
            const allContacts = await ContactsAPI.getAllContacts({queries: {pageSize: PageSize, currentPage}})
            console.log(allContacts, "ALL CONTS");
            if(allContacts.status === 200){
                setContactsData(allContacts?.data);       
            }
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const handleFilterContacts = async (argList) => {
        setActiveFiltersCount(countKeysWithDifferentValues(initialFilterData , filterData))
        const formatFilteredData = {
            ...filterData, 
            pageSize: PageSize,
            currentPage: argList?.newPage || 1,
            teamsIdList: filterData?.teamsIdList?.map(item => item.value),
            customersIdList: filterData?.customersIdList?.map(item => item.value)
        }
        try{
            setLoading(true)
            if(argList?.clear){
                setFilterData(initialFilterData);
                setDateDetails(initDateDetails);
                setActiveFiltersCount(0);
                setCurrentPage(1);
                if(currentPage === 1){
                    const allTasks = await ContactsAPI.getAllContacts({queries: {...initialFilterData}});
                    if(allTasks.status === 200){
                        setContactsData(allTasks?.data);
                    }
                }
            }else{
                const allContacts = await ContactsAPI.getAllContacts({queries: formatFilteredData})
                if(allContacts.status === 200){
                    setContactsData(allContacts?.data);        
                }
            }
            setToggleFilterModal(false)
            setLoading(false)
        }catch(err){
            setToggleFilterModal(false)
            setLoading(false)
        }
    }



    useEffect(()=>{
        getContactsData();
        getFilterData();
    },[currentUserData])

    useEffect(()=>{
        console.log("PAGE NUMBER :",currentPage);
        handleFilterContacts({newPage: currentPage})
    },[currentPage])

    return (
     <div className='p-16px'>
       
           <div className='d-flex justify-content-between align-items-center'>
           <div className='position-relative'>
                <div onClick={()=>setToggleFilterModal(prev => !prev)} className=' cursor h-40px w-fit px-8px d-flex-center gap-10px br-6px border-grey-300 '>
                    <i class="ri-filter-3-line fs-20px lh-20px"></i>
                    <p className={`fs-14px color-grey-600 fw-500 ${activeFilterCount && activeFilterCount > 0 ? 'color-primary-800' : '' }`}> {activeFilterCount && activeFilterCount > 0 ? activeFilterCount : ""} Filter<span>{activeFilterCount && activeFilterCount > 1 ? 's' : ""}</span></p>
                </div>
                {toggleFilterModal && 
                        <div className='filter-container'>
                            <div className='d-flex justify-content-between'>
                                <p className='color-grey-900 fs-16px fw-700'> Filter</p>
                                <div className='d-flex gap-4px'>
                                    <p onClick={()=>{
                                        handleFilterContacts({clear: true})
                                    }} className='fs-14px fw-500 color-grey-700 cursor'>Clear All</p>
                                    <i onClick={()=>{setToggleFilterModal(false);}} className="ri-close-line lh-20px fs-20px cursor"></i>
                                </div>
                            </div>
                            <p className='color-grey-900 fs-16px fw-500 mt-16px'>General</p>

                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Related Teams</label>
                                <div className='position-relative'>
                                    {filterData?.teamsIdList?.length > 0 && 
                                    <p style={{top: "7px", left: "10px"}} className='position-absolute zIndex-1 fs-16px color-grey-400 fw-500'> 
                                        {filterData?.teamsIdList?.length} selected 
                                    </p>}
                                    <Select
                                        isSearchable={false}
                                        menuPortalTarget={document.body} 
                                        value={filterData?.teamsIdList?.length > 0 ? filterData?.teamsIdList : null}
                                        isMulti
                                        placeholder="Select Teams"
                                        isClearable={false}
                                        name="teamsIdList"
                                        components={{ 
                                            MultiValueContainer, 
                                            IndicatorSeparator: () => null
                                        }}
                                        onChange={(chosenOptions)=> {
                                            setFilterData(prev => ({...prev, teamsIdList: chosenOptions}))
                                        }}
                                        styles={{
                                            multiValue: (base) => ({
                                            ...base,
                                            margin: 0,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                            }),
                                            menuPortal: base => ({ ...base, zIndex: 9999 })
                                        }}
                                        options={teamsOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                </div>
                                {filterData?.teamsIdList?.length > 0 && 
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {filterData?.teamsIdList?.map(member => {
                                    return (
                                        <div className='d-flex align-items-center multi-item gap-3px'>
                                            <p className='fs-14px color-grey-700 fw-500'>{member.label}</p>
                                            <i onClick={()=>{setFilterData(prev => ({...prev, teamsIdList: prev?.teamsIdList.filter(item => item.value !== member.value)}))}} 
                                            className="ri-close-line fs-12px p-2px lh-12px cursor color-grey-400 p-2px"></i>
                                        </div>
                                    )
                                })}
                            </div>}
                            </div>
                        
                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Linked Customers</label>
                                <div className='position-relative'>
                                    {filterData?.customersIdList?.length > 0 && 
                                    <p style={{top: "7px", left: "10px"}} className='position-absolute zIndex-1 fs-16px color-grey-400 fw-500'> 
                                        {filterData?.customersIdList?.length} selected 
                                    </p>}
                                    <Select
                                        isSearchable={false}
                                        menuPortalTarget={document.body} 
                                        value={filterData?.customersIdList?.length > 0 ? filterData?.customersIdList : null}
                                        isMulti
                                        placeholder="Select Customers"
                                        isClearable={false}
                                        name="dealIdList"
                                        components={{ 
                                            MultiValueContainer, 
                                            IndicatorSeparator: () => null
                                        }}
                                        onChange={(chosenOptions)=> {
                                            setFilterData(prev => ({...prev, customersIdList: chosenOptions}))
                                        }}
                                        styles={{
                                            multiValue: (base) => ({
                                            ...base,
                                            margin: 0,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                            }),
                                            menuPortal: base => ({ ...base, zIndex: 9999 })
                                        }}
                                        options={leadsOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                </div>
                            </div>
                        
                            {filterData?.customersIdList?.length > 0 && 
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {filterData?.customersIdList?.map(deal => {
                                    return (
                                        <div className='d-flex align-items-center multi-item gap-3px'>
                                            <p className='fs-14px color-grey-700 fw-500'>{deal.label}</p>
                                            <i onClick={()=>{setFilterData(prev => ({...prev, customersIdList: prev.customersIdList.filter(item => item.value !== deal.value)}))}} 
                                            className="ri-close-line fs-12px p-2px lh-12px cursor color-grey-400 p-2px"></i>
                                        </div>
                                    )
                                })}
                            </div>}

                            <p className='color-grey-900 fs-16px fw-500 mt-16px'>Date Range</p>
                            <div style={{backgroundColor: "var(--grey-200)"}} className='w-100 h-71px br-4px d-flex gap-11px p-8px mt-12px'>
                                <div>
                                    <p className='color-grey-600 fs-14px'>Date From</p>
                                    <DatePicker
                                        customInput={ <CustomCalendarInput inputRef={inputRef}/>}
                                        dateFormat="dd/MM/yyyy"
                                        selected={dateDetails?.dateFrom || null}
                                        onChange={(date)=>{
                                            setDateDetails(prev => ({...prev, dateFrom: date}))
                                            setFilterData(prev => ({...prev, dateFrom: moment(date).format('DD/MM/YYYY') }))
                                        }} 
                                    />
                                </div>
                                <div>
                                    <p className='color-grey-600 fs-14px'>Date To</p>
                                    <DatePicker
                                        customInput={ <CustomCalendarInput inputRef={inputRef2}/>}
                                        dateFormat="dd/MM/yyyy"
                                        selected={dateDetails?.dateTo || null}
                                        onChange={(date)=>{
                                            setDateDetails(prev => ({...prev, dateTo: date}))
                                            setFilterData(prev => ({...prev, dateTo: moment(date).format('DD/MM/YYYY') }))
                                        }} 
                                    />
                                </div>
                            </div>



                            <button onClick={()=>handleFilterContacts()} className='primary-btn fw-700 fs-14px w-100 h-40px mt-16px'>
                                Apply
                            </button>


                    
                        </div>
                    }
            </div>
            {ACTIVE_ROLES.includes(currentUserData?.userRole) ? 
                <button onClick={()=>setShowAddContact(prev => !prev)} className='primary-btn h-40px px-12px py-10px br-6px d-flex-center'>
                <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                Contact
                </button> : <div></div>
                }
            </div>  
            {loading ? <Loader /> : 
       contactsData && contactsData?.data?.length > 0 ? 
            <div>
                <table className='mt-17px'>
                    <tr>
                        <th className='fs-14px fw-400 color-grey-600'>Contact Name</th>
                        <th className='fs-14px fw-400 color-grey-600'>Related Customer</th>
                        <th className='fs-14px fw-400 color-grey-600'>Created By</th>
                        <th className='fs-14px fw-400 color-grey-600'>Created time</th>
                    </tr>
                        {contactsData &&  console.log(contactsData?.data, "wot render")}
                    {contactsData?.data?.map(contact => {
                        return (
                            <TableRow handleFilterContacts={handleFilterContacts} currentPage={currentPage} setCurrentPage={setCurrentPage} contact={contact} setEditToggleModal={setEditToggleModal} setContactId={setContactId} setContactsData={setContactsData} setLoading={setLoading}  />
                        )
                    })}
                </table> 
                <div className='d-flex-center' style={{marginTop: "30px"}}>
                  <Pagination
                    className="pagination-bar"
                    currentPage={currentPage}
                    totalCount={contactsData?.totalCount}
                    pageSize={PageSize}
                    onPageChange={page => setCurrentPage(page)}
                  />
                  </div>
            </div>
         : <p className='text-center'>No Items Yet</p>
         }
            {showAddContact && <SideModal  
            heading={"Add Contact"} 
            modalType={"NEW"}
            onSubmit={()=>{
                setSubmitContact(true);
            }} 
            onClose={()=>{
                setShowAddContact(false);
                setSubmitContact(false);
            }}  
            children={<NewContactForm handleFilterContacts={handleFilterContacts} currentPage={currentPage} submitContact={submitContact} setSubmitContact={setSubmitContact} setContactsData={setContactsData} handleModalClose={()=>setShowAddContact(false)}  />}/>}
        {editToggleModal && <SideModal heading="Edit Contact"   
            onSubmit={()=>{
                setSubmitContact(true);
            }}  
            modalType={"EDIT"}
            onClose={()=>{
                setEditToggleModal(false);
                setSubmitContact(false);
            }}  
            children={<NewContactForm setCurrentPage={setCurrentPage} handleFilterContacts={handleFilterContacts} currentPage={currentPage} contactId={contactId} setContactsData={setContactsData} submitContact={submitContact} setSubmitContact={setSubmitContact}  handleModalClose={()=>setEditToggleModal(false)}  />} />}
    </div>
    );

};

const CustomCalendarInput = forwardRef((props, ref) => {
    console.log(props.leadErrors, "DATE PROPS");
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "32px", borderRadius: "6px", 
            backgroundColor: "var(--grey-25)",
             border: "1px solid var(--gray-300, #D0D5DD)" }} {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "4px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} 
            className="ri-calendar-event-line"></i>
        </div>
    );
  });


const TableRow = ({contact, setContactId, setCurrentPage, currentPage, setEditToggleModal, setContactsData, setLoading}) => {
    console.log(contact, "TABLE ROW CONTACT");
    const navigate = useNavigate()
    const [currentUserData, setCurrentUserData] = useOutletContext();    
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeRow, setActiveRow] = useState(false);
    const dropdownRef = useRef(null);
    const contactName = contact?.userValues?.find(item => item.labelName === "Contact Name")?.fieldValue

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)
    })

    const handleDeleteContact = async (contactId) => {
        try{
            setLoading(true)
           const deletedContact = await ContactsAPI.deleteContact(contactId);
           if(deletedContact.status === 200){
            toast.success("Contact has been deleted");
                if(currentPage === 1){
                    const allContacts = await ContactsAPI.getAllContacts({queries: {pageSize: PageSize, currentPage: 1}})
                    if(allContacts.status === 200){
                        setContactsData(allContacts?.data);     
                    }
                    setLoading(false);
                }else{
                    setCurrentPage(1);

                }
           }
           setLoading(false);
        }catch(err){
            setLoading(false);
            console.error(err)
        }
    }


    return (
        <tr 
        onMouseEnter={()=>{setActiveRow(true)}} 
        onMouseLeave={()=>{
            if(!showDropdown){ setActiveRow(false)}
        }}
        onClick={()=>navigate(`/contacts/${contact._id}`)} className='cursor'>
        <td>{contactName || <span className='color-warning-700'>Required: Add a field labeled 'Contact Name'</span>}</td>
        <td>{ADMIN_ROLES.includes(currentUserData?.userRole) ? contact?.linkedCustomer?.userValues?.find(userValue => userValue.labelName === "Customer Name")?.fieldValue : contact.relatedCustomer || "" }</td>
        <td>{contact?.createdBy?.firstName || ""}</td>
        <td className=' position-relative'>
            <div className='d-flex justify-content-between'>

            {moment(contact.cts).format('MMM DD, YYYY hh:mm A')}
          
            {activeRow && (ADMIN_ROLES.includes(currentUserData?.userRole) || TEAM_LEADS.includes(currentUserData?.userRole) ) && 
            <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary display-on-parent'>
                { <i onClick={(e)=>{
                    e.stopPropagation()
                    setEditToggleModal(prev => !prev);
                    setContactId(contact._id)
                }} className="ri-pencil-line fs-14px lh-14px px-8px py-11px cursor"></i>}
                {ADMIN_ROLES.includes(currentUserData?.userRole) && 
                <div className='position-relative'>
                    <i onClick={(e)=>{
                        e.stopPropagation()
                        setShowDropdown(true);
                    }} className="ri-more-2-line fs-20px lh-20px px-8px py-11px cursor"> </i>
                    {showDropdown && (<div ref={dropdownRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                        <p onClick={(e)=>{
                            e.stopPropagation();
                            handleDeleteContact(contact._id)}} 
                        className='table-dropdown-item'>Delete Contact</p>
                    </div>)}
                </div>}
            </div> }

            </div>
          
        </td>
        
    </tr>
    )
}

export default Contacts;