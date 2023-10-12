import React, { useEffect, useState, useRef, forwardRef} from 'react';
import { ActivityAPI, DealsAPI, TeamAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import useOutsideClick from '../../utils/useOutsideClick';
import SideModal from '../../components/Modals/SideModal';
import NewActivityForm from '../Pipelines/components/NewActivityForm';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { ADMIN_SALES, PageSize} from '../../utils/constants';
import { useNavigate } from 'react-router';
import Select from 'react-select';
import { capitalizeFirstLetters } from '../../utils';
import DatePicker from "react-datepicker";
import {countKeysWithDifferentValues } from '../../utils';
import Pagination from '../../components/Pagination';



const Activities = () => {
    const [taskList, setTaskList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newActToggle, setNewActToggle] = useState(false);
    const [editActToggle, setEditActToggle] = useState(false);
    const [submitActivity, setSubmitActivity] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [toggleFilterModal, setToggleFilterModal] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();   
    const [initActivityType, setInitActivityType] = useState("task"); 
    const initialFilterData = {assignedToList: [], dealIdList: [], status: "", priority: "", dateFrom:"", dateTo: "", pageSize: PageSize, currentPage: 1}
    const initDateDetails = {dateFrom : "", dateTo: ""};
    const [filterData, setFilterData] = useState(initialFilterData)    
    const [allUsersList, setAllUsersList] = useState([])
    const [dealsOptions, setDealsOptions] = useState([])
    const [dateDetails, setDateDetails] = useState(initDateDetails);
    const statusList = [{label: "Open", value: "OPEN"},{label: "Completed", value: "CLOSE"},{label: initActivityType?.toUpperCase() === "TASK" ? "Overdue" : "Missed", value: "PENDING"}, {label: "All", value: "ALL"}]
    const priorityList = [{label: "High", value: "HIGH"},{label: "Normal", value: "NORMAL"},{label: "All", value: "ALL"}];
    const inputRef = useRef(null);
    const inputRef2 = useRef(null);
    const [activeFilterCount, setActiveFiltersCount] = useState("");
    const [currentPage, setCurrentPage] = useState(1); 
    const [searchInput, setSearchInput] = useState("");


    const MultiValueContainer = props => {
        return null;
    };

    const getActivityData = async () => {
        try{
            setLoading(true);
            const formatFilteredData = {
                ...filterData, 
                assignedToList: filterData?.assignedToList?.map(item => item.value), 
                dealIdList: filterData?.dealIdList?.map(item => item.value),
                priority: filterData?.priority?.value,
                status: filterData?.status?.value,
                pageSize: PageSize,
                currentPage: 1,
            }
            if(initActivityType){
                const allTasks = await ActivityAPI.getMyActivities({type: initActivityType, queries: formatFilteredData})
                if(allTasks.status === 200){
                    setTaskList(allTasks?.data)
                }
                console.log(allTasks?.data, "DEIIII");
            }
            if(ADMIN_SALES.includes(currentUserData?.userRole) ){
                const allTeams = await TeamAPI.getAllTeams();
                console.log(allTeams, "ALL TEAMS")
                let allTeamMembers = []
                for(let team of allTeams?.data?.data){
                    for(let member of team?.members){
                        if(!allTeamMembers?.map(member => member?.value).includes(member?._id)){
                            allTeamMembers.push({label: member.firstName+" "+member.lastName, value: member._id})
                        }
                    }
                }
                setAllUsersList(allTeamMembers)
            }
            const allDeals = await DealsAPI.getAllDeals();
            setDealsOptions(allDeals?.data?.data?.map(deal => ({label: deal?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue, value: deal._id})))
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const handleFilterActivities = async (argList) => {
        console.log(argList, "FINAL FILTER DATA")
        setActiveFiltersCount(countKeysWithDifferentValues(initialFilterData , filterData))
        const formatFilteredData ={
            ...filterData, 
            assignedToList: filterData?.assignedToList?.map(item => item.value), 
            dealIdList: filterData?.dealIdList?.map(item => item.value),
            priority: filterData?.priority?.value,
            status: filterData?.status?.value,
            pageSize: PageSize,
            currentPage: argList?.newPage || 1,
            searchInput: searchInput || "",
        }
        console.log(initActivityType, "init act type", argList?.clear);
        if(argList?.setPageToOne){
            setCurrentPage(1);
            if(currentPage === 1){
                const allTasks = await ActivityAPI.getMyActivities({type: initActivityType, queries: {...initialFilterData}});
                if(allTasks.status === 200){
                setTaskList(allTasks?.data)
                }
            }
            return;
        }
        console.log(initActivityType, "init act type", argList?.clear);
        
        try{
            console.log(initActivityType, "init act type", argList?.clear);
      
            if(initActivityType){
                setLoading(true)
                console.log(initActivityType, "init act type", argList?.clear);
                if(argList?.clear){
                    console.log("im in act clear")
                    setFilterData(initialFilterData)
                    setDateDetails(initDateDetails)
                    setActiveFiltersCount(0)
                    setCurrentPage(1);
                    if(currentPage === 1){
                        const allTasks = await ActivityAPI.getMyActivities({type: initActivityType, queries: {...initialFilterData}});
                        if(allTasks.status === 200){
                            setTaskList(allTasks?.data)
                        }
                    }
                }
                else{
                    const allTasks = await ActivityAPI.getMyActivities({type: initActivityType, queries: formatFilteredData});
                    if(allTasks.status === 200){
                        setTaskList(allTasks?.data)
                    }
                }
                setToggleFilterModal(false)
                setLoading(false)
            }
        }catch(err){
            setToggleFilterModal(false)
            setLoading(false)
        }
    }


    useEffect(()=>{
        getActivityData()
    },[initActivityType])

    useEffect(()=>{
        if(currentPage === 1){
            handleFilterActivities({newPage: 1})
        }else{
            setCurrentPage(1)
        }
    },[searchInput])

    useEffect(()=>{
        handleFilterActivities({newPage: currentPage})
    },[currentPage])
    
    useEffect(()=>{
        getActivityData()
    },[currentUserData])

    return (
     <div className='p-16px'>
           {<div className='d-flex justify-content-between align-items-baseline grey-divider'>
           <div className='d-flex mt-16px'>
            <div onClick={()=>setInitActivityType("task")} className={`px-24px py-8px cursor ${initActivityType === 'task' ? 'active-border-bottom' : ''}`}>
                <p className={`fs-14px color-grey-700`}>Task</p>
            </div>
            <div onClick={()=>setInitActivityType("call")} className={`px-24px py-8px cursor ${initActivityType === 'call' ? 'active-border-bottom' : ''}`}>
                <p className={`fs-14px color-grey-700`}>Call</p>
            </div>
        </div>
                <button onClick={()=>setNewActToggle(prev => !prev)} className='primary-btn h-40 fs-14px lh-20px px-12px py-10px br-6px d-flex-center'>
                <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                Add Activity
                </button>
            </div>  }

            <div className='position-relative'>
                  <div className='d-flex justify-content-between align-items-baseline'>
                    <div onClick={()=>setToggleFilterModal(prev => !prev)} className=' cursor h-40px w-fit px-8px d-flex-center gap-10px br-6px border-grey-300 mt-16px'>
                        <i class="ri-filter-3-line fs-20px lh-20px"></i>
                        <p className={`fs-14px color-grey-600 fw-500 ${activeFilterCount && activeFilterCount > 0 ? 'color-primary-800' : '' }`}> {activeFilterCount && activeFilterCount > 0 ? activeFilterCount : ""} Filter<span>{activeFilterCount && activeFilterCount > 1 ? 's' : ""}</span></p>
                    </div>
                    <div className='position-relative'>
                        <i style={{left: "14px", top: "8px"}} className="position-absolute ri-search-line"></i>
                        <input onChange={(e)=>{setSearchInput(e.target.value)}} className='pl-35px h-40px w-269px activity-search' type="text" placeholder={initActivityType.toUpperCase() === "TASK" ? `Search Tasks...` : `Search Calls...`}/>
                    </div>
                    </div>
                    {toggleFilterModal && 
                        <div className='filter-container'>
                            <div className='d-flex justify-content-between'>
                                <p className='color-grey-900 fs-16px fw-700'> Filter</p>
                                <div className='d-flex gap-4px'>
                                    <p onClick={()=>{
                                        handleFilterActivities({clear: true})
                                        
                                    }} className='fs-14px fw-500 color-grey-700 cursor'>Clear All</p>
                                    <i onClick={()=>{setToggleFilterModal(false);}} className="ri-close-line lh-20px fs-20px cursor"></i>
                                </div>
                            </div>
                            <p className='color-grey-900 fs-16px fw-500 mt-16px'>General</p>

                            <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Status</label>
                            <Select
                                placeholder="Select Status"
                                value={filterData?.status || null}
                                name="status"
                                menuPortalTarget={document.body} 
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{ 
                                    IndicatorSeparator: () => null
                                }}
                                onChange={(chosenOptions)=> {
                                    setFilterData(prev => ({...prev, status: chosenOptions}))
                                }}
                                options={statusList}
                            />

                            <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Priority</label>
                            <Select
                                placeholder="Select Priority"
                                name="priority"
                                value={filterData?.priority || null}
                                menuPortalTarget={document.body} 
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{ 
                                    IndicatorSeparator: () => null
                                }}
                                onChange={(chosenOptions)=> {
                                    setFilterData(prev => ({...prev, priority: chosenOptions}))
                                }}
                                options={priorityList}
                            />

                        {ADMIN_SALES.includes(currentUserData?.userRole) &&
                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Assigned To</label>
                                <div className='position-relative'>
                                    {filterData?.assignedToList?.length > 0 && 
                                    <p style={{top: "7px", left: "10px"}} className='position-absolute zIndex-1 fs-16px color-grey-400 fw-500'> 
                                        {filterData?.assignedToList?.length} selected 
                                    </p>}
                                    <Select
                                        isSearchable={false}
                                        menuPortalTarget={document.body} 
                                        value={filterData?.assignedToList?.length > 0 ? filterData?.assignedToList : null}

                                        isMulti
                                        placeholder="Select Assignees"
                                        isClearable={false}
                                        name="assignedToList"
                                        components={{ 
                                            MultiValueContainer, 
                                            IndicatorSeparator: () => null
                                        }}
                                        onChange={(chosenOptions)=> {
                                            setFilterData(prev => ({...prev, assignedToList: chosenOptions}))
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
                                        options={allUsersList}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                </div>
                                {filterData?.assignedToList?.length > 0 && 
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {filterData?.assignedToList?.map(member => {
                                    return (
                                        <div className='d-flex align-items-center multi-item gap-3px'>
                                            <p className='fs-14px color-grey-700 fw-500'>{member.label}</p>
                                            <i onClick={()=>{setFilterData(prev => ({...prev, assignedToList: prev.assignedToList.filter(item => item.value !== member.value)}))}} 
                                            className="ri-close-line fs-12px p-2px lh-12px cursor color-grey-400 p-2px"></i>
                                        </div>
                                    )
                                })}
                            </div>}
                            </div>
                        }
                            <div>
                                <label className='color-grey-600 fs-14px fw-400 mb-6px mt-12px' htmlFor='name'>Deals</label>
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

                            <p className='color-grey-900 fs-16px fw-500 mt-16px'>{initActivityType?.toUpperCase() === "TASK" ? "Due Date" : "Start Date"} Range</p>
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



                            <button onClick={handleFilterActivities} className='primary-btn fw-700 fs-14px w-100 h-40px mt-16px'>
                                Apply
                            </button>


                    
                        </div>
                    }
                </div>
            {loading ? <Loader /> : 
            taskList && taskList?.data?.length > 0 ? 
            <div>
                <table className='mt-17px'>
                    <tr>
                        {initActivityType.toUpperCase() === "CALL" ? <th>Call With</th> : <th>Task Name</th>}
                        {initActivityType.toUpperCase() === "CALL" ? <th>Call Start Date</th> : <th>Due Date</th>}
                        <th>Assigned To</th>
                        <th>Related Deal</th>
                        <th>Priority</th>
                    </tr>
                    {taskList?.data?.map(task => {
                        return (
                            <TableRow handleFilterActivities={handleFilterActivities} setCurrentPage={setCurrentPage} initActivityType={initActivityType} task={task} setEditActToggle={setEditActToggle} setCurrentTask={setCurrentTask} setTaskList={setTaskList} setLoading={setLoading} filterData={filterData}  />
                        )
                    })}
                </table>
                <div className='d-flex-center' style={{marginTop: "30px"}}>
                    <Pagination
                    className="pagination-bar"
                    currentPage={currentPage}
                    totalCount={taskList?.totalCount}
                    pageSize={PageSize}
                    onPageChange={page => setCurrentPage(page)}
                    />
                </div>
            </div>
            : <p className='text-center mt-100px'>No Tasks Yet</p>
            }
          {newActToggle && <SideModal 
            heading="Create Activity"
            modalType={"NEW"}   
            onSubmit={()=>{
                setSubmitActivity(true);
            }}  
            onClose={()=>{
                setNewActToggle(false);
                setSubmitActivity(false);
            }}  
            children={<NewActivityForm 
                handleFilterActivities={handleFilterActivities}
                allActivityPage={true} cb={(val) => setInitActivityType(val)}
                initActivityType={initActivityType} setTaskList={setTaskList} 
                submitActivity={submitActivity} setSubmitActivity={setSubmitActivity}  
                handleModalClose={()=>setNewActToggle(false)}  />} />}
        {editActToggle && <SideModal 
            heading="Edit Activity"   
            modalType={"EDIT"}
            onSubmit={()=>{
                setSubmitActivity(true);
            }}  
            onClose={()=>{
                setEditActToggle(false);
                setSubmitActivity(false);
            }}  
            cb={(val) => setInitActivityType(val)}
            children={
            <NewActivityForm 
            handleFilterActivities={handleFilterActivities}
            allActivityPage={true} initActivityType={initActivityType} 
                currentTaskData={currentTask} setTaskList={setTaskList} submitActivity={submitActivity} 
                setSubmitActivity={setSubmitActivity}  handleModalClose={()=>setEditActToggle(false)} 
                cb={(val) => setInitActivityType(val)} />} />}
            {/* dealId={dealId}  */}
            {/* {showAddContact && <SideModal  
            heading={"Add Contact"} 
            onSubmit={()=>{
                setSubmitContact(true);
            }} 
            onClose={()=>{
                setShowAddContact(false);
                setSubmitContact(false);
            }}  
            children={<NewContactForm submitContact={submitContact} setSubmitContact={setSubmitContact} setContactsData={setContactsData} handleModalClose={()=>setShowAddContact(false)}  />}/>}
        {editToggleModal && <SideModal heading="Edit Contact"   
            onSubmit={()=>{
                setSubmitContact(true);
            }}  
            onClose={()=>{
                setEditToggleModal(false);
                setSubmitContact(false);
            }}  
            children={<NewContactForm contactId={contactId} setContactsData={setContactsData} submitContact={submitContact} setSubmitContact={setSubmitContact}  handleModalClose={()=>setEditToggleModal(false)}  />} />} */}
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


const TableRow = ({task, setCurrentTask, setEditActToggle, setTaskList, setLoading, initActivityType, filterData, setCurrentPage, handleFilterActivities}) => {
    // console.log(task?.linkedCallContact?.userValues?.find(userValue => userValue.labelName === "Contact Name").fieldValue, "TABLE ROW SINGLE ACT");
    const [currentUserData, setCurrentUserData] = useOutletContext();    
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeRow, setActiveRow] = useState(false);
    const dropdownRef = useRef(null);

    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)
    })

    const handleDeleteActivity = async (activitiyId) => {
        try{
            setLoading(true)
           const deletedContact = await ActivityAPI.deleteActivity(task.linkedDeal._id, activitiyId);
           
           if(deletedContact.status === 200){
            handleFilterActivities({setPageToOne: true})
            toast.success("Task has been deleted");
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const handleMarkAsDone = async (activitiyId) => {
        try{
            setLoading(true)
            const deletedContact = await ActivityAPI.updateActivity(activitiyId, {...task, status: "CLOSE", assignedTo: task?.assignedTo?._id || ""});
           
           if(deletedContact.status === 200){
                handleFilterActivities({setPageToOne:true})
                toast.success("Task has been marked as done");
            }
          
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }
    const handleMarkAsUnDone = async (activitiyId) => {
        try{
            setLoading(true)
            const deletedContact = await ActivityAPI.updateActivity(activitiyId, {...task, status: "OPEN", assignedTo: task?.assignedTo?._id || ""});
            if(deletedContact.status === 200){
                    toast.success("Task has been marked as open");
                    handleFilterActivities({setPageToOne:true})
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
        }} className='cursor'>
        <td className='d-flex'>
            {initActivityType.toUpperCase()==="CALL" ? task?.linkedCallContact?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue || "Contact doesnt have a name" : task?.taskName}
            {task?.status === "CLOSE" ? <div className='badge-completed color-success ml-12px'>Completed</div> : 
                task?.status === "OPEN" && moment().isAfter(moment(task?.taskDueDate)) ? 
                <div className='badge-completed color-error-red ml-12px'>{initActivityType.toUpperCase() === "CALL" ? "Missed" : "Overdue"}</div> : <div className='badge-completed color-success ml-12px'>Open</div>
                }
        </td>
        <td>{initActivityType.toUpperCase()==="CALL" ? moment(task?.callStartDate).format("DD/MM/YYYY") : moment(task?.taskDueDate).format("DD/MM/YYYY")}</td>
        <td>{task?.assignedTo?.firstName + " "+task?.assignedTo?.lastName}</td>
        <td>{task?.linkedDeal?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue || "Deal doesnt have a name"}</td>
        <td className='position-relative'>
            <div className='d-flex justify-content-between pr-66px'>
                {task?.priority === "HIGH" ? "High": "Normal"}

               {activeRow && <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary '>
                    { <i onClick={(e)=>{
                        e.stopPropagation()
                        setEditActToggle(prev => !prev);
                        setCurrentTask(task)
                    }} className="ri-pencil-line fs-14px lh-14px px-8px py-11px cursor"></i>}
                    <div className='position-relative'>
                        <i onClick={(e)=>{
                            e.stopPropagation()
                            setShowDropdown(true);
                        }} className="ri-more-2-line fs-20px lh-20px px-8px py-11px cursor"> </i>
                        {showDropdown && (
                        <div ref={dropdownRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                            {task?.status === "OPEN" ?
                            <p onClick={(e)=>{
                                e.stopPropagation();
                                handleMarkAsDone(task._id)}} 
                                className='table-dropdown-item'>Mark as Done</p> :
                            <p onClick={(e)=>{
                                e.stopPropagation();
                                handleMarkAsUnDone(task._id)}} className='table-dropdown-item'>
                                    Mark as Open
                            </p>}
                            {/* <p onClick={(e)=>{
                                e.stopPropagation();
                                handleMarkAsDone(task._id)}} 
                                className='table-dropdown-item'>
                                    Mark As Done
                            </p> */}
                            <p onClick={(e)=>{
                                e.stopPropagation();
                                handleDeleteActivity(task._id)}} className='table-dropdown-item'>
                                    Delete Activity
                            </p>
                        </div>)}
                    </div>
                </div>}
            </div>
        </td>
        
        
    </tr>
    )
}

export default Activities;