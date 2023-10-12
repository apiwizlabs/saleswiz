import React, { useEffect, useRef, useState } from 'react';
import { ActivityAPI } from '../../../api/apiConfig';
import { useParams } from 'react-router-dom';
import { Loader } from '../../../components/Loader';
import useOutsideClick from '../../../utils/useOutsideClick';
import SideModal from '../../../components/Modals/SideModal';
import NewActivityForm from './NewActivityForm';
import moment from 'moment';
import {toast} from 'react-toastify';
import { useOutletContext } from 'react-router-dom';
import { ADMIN_ROLES } from '../../../utils/constants';

const Calls = ({dealsData}) => {

    const {dealId} = useParams();
    const [taskList, setTaskList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newActToggle, setNewActToggle] = useState(false);
    const [editActToggle, setEditActToggle] = useState(false);
    const [submitActivity, setSubmitActivity] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [currentUserData, setCurrentUserData ] = useOutletContext();

    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const activityData = await ActivityAPI.getDealActivities({dealId, type: "CALL"})
                console.log(activityData, "CALL DATA ");
                if(activityData.status === 200){
                    console.log(activityData?.data?.data, "Notes Dataa");
                    setTaskList(activityData?.data?.data);
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])
    console.log("CALL DATA");

    return (
        <div className='mt-16px h-100 w-100'>
            {loading ? <Loader/> : 
            <>
                <div className='d-flex gap-16px'>
                    <div className='activity-info-box'>
                        <p className='text-center color-grey-500 fs-16px fw-700'>All</p>
                        <p className='color-grey-900 fs-24px fw-700 text-center'>{taskList?.length || 0}</p>
                    </div>
                    <div className='activity-info-box'>
                        <p className='text-center color-grey-500 fs-16px fw-700'>Upcoming</p>
                        <p className='color-grey-900 fs-24px fw-700 text-center'>{taskList?.filter(task => task.status === "OPEN" && moment().isBefore(moment(task.callStartDate, 'DD/MM/YYYY'))).length || 0}</p>
                    </div>
                    <div className='activity-info-box'>
                        <p className='text-center color-grey-500 fs-16px fw-700'>Overdue</p>
                        <p className='color-grey-900 fs-24px fw-700 text-center color-error-red'>{taskList?.filter(task => task.status === "OPEN" && moment().isAfter(moment(task.callStartDate, 'DD/MM/YYYY'))).length || 0}</p>
                    </div>
                    <div className='activity-info-box'>
                        <p className='text-center color-grey-500 fs-16px fw-700'>Completed</p>
                        <p className='color-grey-900 fs-24px fw-700 text-center'>{taskList?.filter(task => task.status === "CLOSE").length || 0}</p>
                    </div>
                </div>
                <div className=''>
                    <div className='d-flex justify-content-between align-items-center mt-24px'>
                        <p className='color-grey-900 fs-14px fw-700'>All Details</p>
                        <button onClick={()=>setNewActToggle(prev => !prev)} className='btn-outline-primary d-flex-center gap-6px py-10px pl-12px pr-16px'> 
                        <i class="ri-add-line fs-20px lh-20px"></i> Call</button>
                    </div>
                    <div className='d-flex flex-column mt-8px'>
                        {loading ? <Loader /> : taskList?.length > 0 ? taskList?.map(task => {
                            return(
                                <TaskCard setTaskList={setTaskList} task={task} setEditActToggle={setEditActToggle} setCurrentTask={setCurrentTask} setLoading={setLoading} dealId={dealId} />
                            )
                        }) :  <p>No Calls Yet</p>}
                    </div>
                </div>
            </>}

            {newActToggle && 
            <SideModal 
            modalType={"NEW"}
            heading="Create Activity"   
            onSubmit={()=>{
                setSubmitActivity(true);
            }}  
            onClose={()=>{
                setNewActToggle(false);
                setSubmitActivity(false);
            }}  
            children={
                <NewActivityForm 
                    initActivityType={"call"} dealsData={dealsData} dealId={dealId} setTaskList={setTaskList} submitActivity={submitActivity} setSubmitActivity={setSubmitActivity}  handleModalClose={()=>setNewActToggle(false)}  />} />}

            {editActToggle && <SideModal 
                        modalType={"EDIT"}
            heading="Edit Activity"   
            onSubmit={()=>{
                setSubmitActivity(true);
            }}  
            onClose={()=>{
                setEditActToggle(false);
                setSubmitActivity(false);
            }}  
            currentTaskData={currentTask}
            children={<NewActivityForm initActivityType={"call"} currentTaskData={currentTask} dealsData={dealsData} dealId={dealId} setTaskList={setTaskList} submitActivity={submitActivity} setSubmitActivity={setSubmitActivity}  handleModalClose={()=>setEditActToggle(false)}  />} />}


        </div>
        
    );
};

const TaskCard = ({task, setEditActToggle, setCurrentTask, setTaskList, dealId, setLoading}) => {
    const ddref = useRef(null)

    useOutsideClick(ddref, ()=>{
        setToggleDropdown(false);
    })
    const [currentUserData, setCurrentUserData ] = useOutletContext();
    const [taskCardFocus, setTaskCardFocus] = useState(false);
    // const [toggleEdit, setToggleEdit] = useState(false);
    const [toggleDropdown, setToggleDropdown] = useState(false);

    const handleDelete = async () => {
        try{
            setLoading(true);
            console.log(dealId, task._id,"IDS FOR OBS");
           const deletedActivity = await ActivityAPI.deleteActivity(dealId, task._id);
           if(deletedActivity){
               const taskata = await ActivityAPI.getDealActivities({dealId, type: "CALL"})
               setTaskList(taskata?.data?.data);
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
        }
    }

    const handleMarkAsDone = async () => {
        try{
            setLoading(true)
           const deletedContact = await ActivityAPI.updateActivity(task._id, {...task, status: "CLOSE", assignedTo: task?.assignedTo?._id});
           
           if(deletedContact.status === 200){
            const allContacts = await ActivityAPI.getDealActivities({type: "CALL", dealId})
                if(allContacts.status === 200){
                    setTaskList(allContacts?.data?.data);                        
                }
                setLoading(false);
                toast.success("Call has been marked as done");
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }  

    const handleMarkAsUndone = async () => {
        try{
            setLoading(true)
           const deletedContact = await ActivityAPI.updateActivity(task._id, {...task, status: "OPEN", assignedTo: task?.assignedTo?._id});
           
           if(deletedContact.status === 200){
            const allContacts = await ActivityAPI.getDealActivities({type: "CALL", dealId})
                if(allContacts.status === 200){
                    setTaskList(allContacts?.data?.data);                        
                }
                setLoading(false);
                toast.success("Call has been marked as Open");
           }
           setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    return (
        <div onMouseEnter={()=>setTaskCardFocus(true)} onMouseLeave={()=>setTaskCardFocus(false)} 
        className='d-flex justify-content-between px-24px py-20px activity-card'>
        <div className='d-flex gap-16px'>
            <i class="ri-phone-line fs-24px lh-24px"></i>
            <div className='d-flex flex-column gap-8px'>
                <p className='fs-16px fw-700 color-black-purple'>{`Call with ${task?.linkedCallContact?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue}`}</p>
                <p className='fs-14px fw-500 color-grey-600'>{moment(task?.callStartDate).format('MMMM D')} {task?.priority === "HIGH" && <span>• <span className='color-primary-500 fw-500 fs-14px'> High Priority </span> </span>}</p>
                <p className='d-flex gap-8px'><i class="ri-user-line"></i>{task?.assignedTo?.firstName + " " + task?.assignedTo?.lastName}</p>
            </div>
        </div>
        <div className='d-flex gap-16px justify-content-center'>
            {taskCardFocus && <>
                {task?.status === "CLOSE" ? 
                    <div className='badge-completed color-success'>Completed</div> : 
                    task?.status === "OPEN" && moment().isAfter(moment(task?.callStartDate, 'DD/MM/YYYY')) ? 
                    <div className='badge-completed color-error-red'>Missed</div> : 
                    <div className='badge-completed color-success'>Open</div>
                }
                <div className='mr-4px position-relative'>
                   {(ADMIN_ROLES.includes(currentUserData.userRole) || task.createdBy === currentUserData.userId || task.assignedTo === currentUserData.userId) && <i onClick={()=>{setToggleDropdown(prev => !prev)}} className="ri-more-2-fill cursor"></i>}
                    {toggleDropdown && <div ref={ddref} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                        <p onClick={(e)=>{
                            setToggleDropdown(false)
                            setCurrentTask(task)
                            setEditActToggle(true)}} className='table-dropdown-item'>Edit Call</p>
                        <p onClick={handleDelete} className='table-dropdown-item'>Delete Call</p>
                        {task?.status === "OPEN" ?
                        <p onClick={handleMarkAsDone} className='table-dropdown-item'>Mark as Done</p> :
                        <p onClick={handleMarkAsUndone} className='table-dropdown-item'>Mark as Open</p>}
                    </div>}
                </div>
            </>}
           
        </div>
    </div>
    )
}

export default Calls;