import React, { useEffect, useState, useRef, forwardRef} from 'react';
import { LeadsAPI, DealsAPI, TeamAPI, ContactsAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import useOutsideClick from '../../utils/useOutsideClick';
import SideModal from '../../components/Modals/SideModal';
import NewLeadForm from './NewLeadForm';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { ADMIN_ROLES, TEAM_LEADS, ACTIVE_ROLES, ADMIN_SALES } from '../../utils/constants';
import { useNavigate } from 'react-router';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { extractContacts } from '../../utils';
import { countKeysWithDifferentValues } from '../../utils';
import Pagination from '../../components/Pagination';
import { PageSize } from '../../utils/constants';

const Leads = () => {
    const [leadsData, setLeadsData] = useState(null);
    const [currentPage, setCurrentPage]= useState(1);
    const [loading, setLoading] = useState(false);
    const [editToggleModal , setEditToggleModal] = useState(false);
    const [customerId, setCustomerId] = useState(false);
    const [showAddLead, setShowAddLead] = useState(false);
    const [submitLead, setSubmitLead] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [activeFilterCount, setActiveFiltersCount] = useState('')
    const [toggleFilterModal, setToggleFilterModal] = useState(false);
    const initialFilterData = {contactIdList: [], dealIdList: [],  teamsIdList: [], dateFrom:"", dateTo: "", pageSize: PageSize, currentPage: 1}
    const initDateDetails = {dateFrom : "", dateTo: ""};
    const [filterData, setFilterData] = useState(initialFilterData)
    const [dateDetails, setDateDetails] = useState(initDateDetails);
    const [dealsOptions, setDealsOptions] = useState([])
    const [contactsOptions, setContactsOptions] = useState([])
    const [teamsOptions, setTeamsOptions] = useState([])
    const inputRef = useRef(null);
    const inputRef2 = useRef(null);

    const MultiValueContainer = props => {
        return null;
    };


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true);
                const allCustomers = await LeadsAPI.getAllCustomers({queries: {currentPage: 1, pageSize: PageSize}})
                console.log("ALL LEADS DATA :: ",allCustomers);
                if(allCustomers.status === 200){
                    // if(ADMIN_ROLES.includes(currentUserData?.userRole)){
                        setLeadsData(allCustomers?.data);                        
                    // }else{
                    //     let nestedCustomers = allCustomers?.data?.data.map(teamData =>[ ...teamData.customers]);
                    //     let arr1d = [].concat.apply([], nestedCustomers); //converting from 2d to 1d array
                    //     console.log("ARR !D :: ",arr1d);
                    //     setLeadsData(arr1d); 
                    // }
                }
                const allDeals = await DealsAPI.getAllDeals();
                if(allDeals?.status === 200){
                    setDealsOptions(allDeals?.data?.data?.map(deal => ({label: deal?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue, value: deal._id})))
                }
                const teamsData = await TeamAPI.getAllTeams();
                if(teamsData?.status === 200){
                    setTeamsOptions(teamsData.data.data.map(team => ({label: team?.teamName, value: team._id})));
                }

                const allContacts = await ContactsAPI.getAllContacts();
               
                if(allContacts?.status === 200){
                    // if(ADMIN_ROLES.includes(currentUserData?.userRole)){
                        console.log(allContacts, "ist of conts 123");
                        setContactsOptions(allContacts?.data?.data?.map(deal => ({label: deal?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue, value: deal._id})));                        
                    // }else{
                    //     let contactsList = extractContacts(allContacts.data);
                    //     console.log(contactsList, "ALL CONTS DATA")
                    //     setContactsOptions(contactsList?.map(deal => ({label: deal?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue, value: deal._id}))); 
                    // }
                }
                setLoading(false);

            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[currentUserData])

    const handleFilterLeads = async (argList) => {
        setActiveFiltersCount(countKeysWithDifferentValues(initialFilterData , filterData))
        console.log(argList, filterData, "LEAD FILTTT")
        const formatFilteredData = {
            ...filterData, 
            pageSize: PageSize,
            currentPage: argList?.newPage || 1,
            dealsIdList: filterData?.dealIdList?.map(item => item.value), 
            teamsIdList: filterData?.teamsIdList?.map(item => item.value),
            contactIdList: filterData?.contactIdList?.map(item => item.value)
        }
        try{
            setLoading(true)
            if(argList?.clear){
                setFilterData(initialFilterData);
                setDateDetails(initDateDetails);
                setActiveFiltersCount(0);
                setCurrentPage(1)
                if(currentPage === 1){
                    const allCustomers = await LeadsAPI.getAllCustomers({queries: initialFilterData})
                    if(allCustomers.status === 200){
                        setLeadsData(allCustomers?.data);     
                    }
                }
                
            }else{
                console.log("in here :: ",formatFilteredData);
                const allCustomers = await LeadsAPI.getAllCustomers({queries: formatFilteredData})
                if(allCustomers.status === 200){
                    setLeadsData(allCustomers?.data);     
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
        handleFilterLeads({newPage: currentPage})
    },[currentPage])

    return (
     <div className='p-16px'>
            <div className='d-flex justify-content-between align-items-center'>
            <div className='position-relative'>
                    <div onClick={()=>setToggleFilterModal(prev => !prev)} className=' cursor h-40px w-fit px-8px d-flex-center gap-10px br-6px border-grey-300'>
                        <i class="ri-filter-3-line fs-20px lh-20px"></i>
                        <p className={`fs-14px color-grey-600 fw-500 ${activeFilterCount && activeFilterCount > 0 ? 'color-primary-800' : '' }`}> {activeFilterCount && activeFilterCount > 0 ? activeFilterCount : ""} Filter<span>{activeFilterCount && activeFilterCount > 1 ? 's' : ""}</span></p>
                    </div>
                    {toggleFilterModal && 
                        <div className='filter-container'>
                            <div className='d-flex justify-content-between'>
                                <p className='color-grey-900 fs-16px fw-700'> Filter</p>
                                <div className='d-flex gap-4px'>
                                    <p onClick={()=>{                                        
                                        handleFilterLeads({clear: true})
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
                                        name="teamIdList"
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
                                                    <i onClick={()=>{setFilterData(prev => ({...prev, teamsIdList: prev.teamsIdList.filter(item => item.value !== member.value)}))}} 
                                                    className="ri-close-line fs-12px p-2px lh-12px cursor color-grey-400 p-2px"></i>
                                                </div>
                                            )
                                        })}
                                    </div>
                                }
                            </div>
                        
                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Linked Deals</label>
                                <div className='position-relative'>
                                    {filterData?.dealIdList?.length > 0 && 
                                    <p style={{top: "7px", left: "10px"}} className='position-absolute zIndex-1 fs-16px color-grey-400 fw-500'> 
                                        {filterData?.dealIdList?.length} selected 
                                    </p>}
                                    <Select
                                        isSearchable={false}
                                        menuPortalTarget={document.body} 
                                        value={filterData?.dealIdList?.length > 0 ? filterData?.dealIdList : null}
                                        isMulti
                                        placeholder="Select Deals"
                                        isClearable={false}
                                        name="dealIdList"
                                        components={{ 
                                            MultiValueContainer, 
                                            IndicatorSeparator: () => null
                                        }}
                                        onChange={(chosenOptions)=> {
                                            setFilterData(prev => ({...prev, dealIdList: chosenOptions}))
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
                                        options={dealsOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                </div>
                            </div>
                            {filterData?.dealIdList?.length > 0 && 
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {filterData?.dealIdList?.map(deal => {
                                    return (
                                        <div className='d-flex align-items-center multi-item gap-3px'>
                                            <p className='fs-14px color-grey-700 fw-500'>{deal.label}</p>
                                            <i onClick={()=>{setFilterData(prev => ({...prev, dealIdList: prev.dealIdList.filter(item => item.value !== deal.value)}))}} 
                                            className="ri-close-line fs-12px p-2px lh-12px cursor color-grey-400 p-2px"></i>
                                        </div>
                                    )
                                })}
                            </div>}
                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Linked Contacts</label>
                                <div className='position-relative'>
                                    {filterData?.contactIdList?.length > 0 && 
                                    <p style={{top: "7px", left: "10px"}} className='position-absolute zIndex-1 fs-16px color-grey-400 fw-500'> 
                                        {filterData?.contactIdList?.length} selected 
                                    </p>}
                                    <Select
                                        isSearchable={false}
                                        menuPortalTarget={document.body} 
                                        value={filterData?.contactIdList?.length > 0 ? filterData?.contactIdList : null}
                                        isMulti
                                        placeholder="Select Deals"
                                        isClearable={false}
                                        name="contactIdList"
                                        components={{ 
                                            MultiValueContainer, 
                                            IndicatorSeparator: () => null
                                        }}
                                        onChange={(chosenOptions)=> {
                                            setFilterData(prev => ({...prev, contactIdList: chosenOptions}))
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
                                        options={contactsOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                </div>
                            </div>
                        
                            {filterData?.contactIdList?.length > 0 && 
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {filterData?.contactIdList?.map(deal => {
                                    return (
                                        <div className='d-flex align-items-center multi-item gap-3px'>
                                            <p className='fs-14px color-grey-700 fw-500'>{deal.label}</p>
                                            <i onClick={()=>{setFilterData(prev => ({...prev, contactIdList: prev.contactIdList.filter(item => item.value !== deal.value)}))}} 
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



                            <button onClick={handleFilterLeads} className='primary-btn fw-700 fs-14px w-100 h-40px mt-16px'>
                                Apply
                            </button>


                    
                        </div>
                    }
                </div>
                {ACTIVE_ROLES.includes(currentUserData?.userRole) && <button onClick={()=>setShowAddLead(prev => !prev)} className='primary-btn h-40px px-12px py-10px br-6px d-flex-center'>
                <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                Lead
                </button>}
            </div>  
            {loading ? <Loader /> : 
       leadsData && leadsData?.data?.length > 0 ? 
       <div>
        <table className='mt-17px'>
             <tr>
                 <th className='fs-14px fw-400 color-grey-600'>Customer Name</th>
                 <th className='fs-14px fw-400 color-grey-600'>Status</th>
                 <th className='fs-14px fw-400 color-grey-600'>Created By</th>
                 <th className='fs-14px fw-400 color-grey-600'>Created time</th>
             </tr>
             {leadsData?.data?.map(lead => {
                 return (
                     <TableRow setCurrentPage={setCurrentPage} currentPage={currentPage} lead={lead} setEditToggleModal={setEditToggleModal} setCustomerId={setCustomerId} setLeadsData={setLeadsData} setLoading={setLoading}  />
                 )
             })}
         </table>
         <div className='d-flex-center' style={{marginTop: "30px"}}>
            <Pagination
            className="pagination-bar"
            currentPage={currentPage}
            totalCount={leadsData?.totalCount}
            pageSize={PageSize}
            onPageChange={page => setCurrentPage(page)}
            />
            </div>
         </div> : <p className='text-center'>No Items Yet</p>
         }
            {showAddLead && <SideModal 
            modalType={"NEW"} 
            heading={"Add Lead"} 
            onSubmit={()=>{
                setSubmitLead(true);
            }} 
            onClose={()=>{
                setShowAddLead(false);
                setSubmitLead(false);
            }}  
            children={<NewLeadForm  handleFilterLeads={handleFilterLeads} setCurrentPage={setCurrentPage} submitLead={submitLead} setSubmitLead={setSubmitLead} setLeadsData={setLeadsData} handleModalClose={()=>setShowAddLead(false)}  />}/>}
        {editToggleModal && 
        <SideModal heading="Edit Lead"
        modalType={"EDIT"}   
            onSubmit={()=>{
                setSubmitLead(true);
            }}  
            onClose={()=>{
                setEditToggleModal(false);
                setSubmitLead(false);
            }}  
            children={<NewLeadForm currentPage={currentPage}  setCurrentPage={setCurrentPage} handleFilterLeads={handleFilterLeads} customerId={customerId} setLeadsData={setLeadsData} submitLead={submitLead} setSubmitLead={setSubmitLead}  handleModalClose={()=>setEditToggleModal(false)}  />} />}
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

const TableRow = ({lead, setCustomerId, setEditToggleModal, setLeadsData, setLoading, setCurrentPage, currentPage}) => {
    const navigate = useNavigate()
    const [currentUserData, setCurrentUserData] = useOutletContext();    
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [activeRow, setActiveRow] = useState(false);
    const leadName = lead?.userValues?.find(item => item.labelName === "Customer Name").fieldValue;

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)
    })

    const handleDeleteLead = async (customerId) => {
        try{
            setLoading(true)
           const deletedTeam = await LeadsAPI.deleteCustomer(customerId)
           if(deletedTeam.status === 200){
            toast.success("Customer has been deleted");
            if(currentPage === 1){
                const allCustomers = await LeadsAPI.getAllCustomers({queries: {currentPage: 1, pageSize: PageSize}});
                if(allCustomers.status === 200){
                    setLeadsData(allCustomers?.data);       
                }
                setLoading(false);
            }
            setCurrentPage(1)
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
        onClick={()=>navigate(`/leads/${lead._id}`)} className='cursor'>
        <td>{leadName || <span className='color-warning-700'>Required: Add a field labeled 'Customer Name'</span>}</td>
        <td>{lead?.deals?.length > 0 ? 
            <p className='color-success-700 fs-14px fw-600'>Deal Created</p> : 
            <p className='color-warning-700 fs-14px fw-600'>Lead</p> || 0}
        </td>
        <td>{lead?.createdBy?.firstName || ""}</td>
        <td className='position-relative'>
            <div className='d-flex justify-content-between'>
                {moment(lead.cts).format('MMM DD, YYYY hh:mm A')}
            
                {activeRow && (ADMIN_ROLES.includes(currentUserData?.userRole) || TEAM_LEADS.includes(currentUserData?.userRole) ) && 
                <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary display-on-parent'>
                    { <i onClick={(e)=>{
                        e.stopPropagation()
                        setEditToggleModal(prev => !prev);
                        setCustomerId(lead._id)
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
                                handleDeleteLead(lead._id)}} className='table-dropdown-item'>Delete Lead</p>
                        </div>)}
                    </div>}
                </div> }   
            </div>
                                                                                                                                                      
        </td>
        
    </tr>
    )
}

export default Leads;