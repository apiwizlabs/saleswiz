import React, { useState, useEffect, forwardRef, useRef } from 'react';
import Select from 'react-select';
import { ActivityAPI, DealsAPI } from '../../../api/apiConfig';
import { Loader } from '../../../components/Loader';
import DatePicker from "react-datepicker";
import CheckedBox from "../../../assets/icons/small-checked.svg"
import UncheckedBox from "../../../assets/icons/small-unchecked.svg"
import moment from 'moment';
import { useParams } from 'react-router';


const NewActivityForm = ({handleFilterActivities, dealsData, submitActivity, cb, setSubmitActivity, dealId, handleModalClose, setTaskList, initActivityType, currentTaskData, allActivityPage }) => {
console.log(currentTaskData, "CURRENT TAS CALL")
    const [activeType, setActiveType] = useState(initActivityType)
    const {dealId : paramsDealId} = useParams()
    const initTaskData = activeType.toUpperCase() === "TASK" && currentTaskData ?  
    {
        assignedTo: currentTaskData?.assignedTo?._id,
        taskName: currentTaskData?.taskName,
        linkedDeal: typeof currentTaskData?.linkedDeal === "object" ? currentTaskData?.linkedDeal._id : (currentTaskData?.linkedDeal || paramsDealId ) ,
        taskDueDate: currentTaskData?.taskDueDate,
        taskDescription: currentTaskData?.taskDescription,
        priority: currentTaskData?.priority,
        activityType: initActivityType.toUpperCase()
    } : activeType.toUpperCase() === "TASK" ? {
        assignedTo: "",
        taskName: "",
        linkedDeal: typeof currentTaskData?.linkedDeal === "object" ? currentTaskData?.linkedDeal._id : (currentTaskData?.linkedDeal || paramsDealId) ,
        taskDueDate:"",
        taskDescription:"",
        priority: "NORMAL",
        activityType: activeType.toUpperCase()
    } : null;
    console.log(initTaskData,"TASK EDIT DATAATTA :: ",currentTaskData);


    const initCallData = activeType.toUpperCase() === "CALL" && currentTaskData ?  
    {
        assignedTo: currentTaskData?.assignedTo?._id,
        linkedCallContact: currentTaskData?.linkedCallContact?._id,
        linkedDeal: typeof currentTaskData?.linkedDeal === "object" ? currentTaskData?.linkedDeal?._id : (currentTaskData?.linkedDeal || paramsDealId) ,
        priority: currentTaskData?.priority,
        callDescription: currentTaskData?.callDescription,
        callStartTime: currentTaskData?.callStartTime,
        callStartDate: currentTaskData?.callStartDate,
        activityType: initActivityType.toUpperCase()
    } : activeType.toUpperCase() === "CALL" ? {
        assignedTo: "",
        taskName: "",
        linkedDeal: typeof currentTaskData?.linkedDeal === "object" ? currentTaskData?.linkedDeal._id : (currentTaskData?.linkedDeal || paramsDealId) ,
        taskDueDate:"",
        taskDescription:"",
        priority: "NORMAL",
        activityType: activeType.toUpperCase()
    } : null;

    console.log(initCallData, initTaskData, "INITSS")

    const [taskInput, setTaskInput] = useState(initTaskData)
    const [callInput, setCallInput] = useState(initCallData)
    const [taskErrors, setTaskErrors] = useState({});
    const [callErrors, setCallErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [chooseDealToggle, setChooseDealToggle] = useState(false);
    const [dealsOptions, setDealsOptions] = useState([])
    const [assigneeList, setAssigneeList] = useState(dealsData ? dealsData?.linkedCustomer?.linkedTeam?.members.map(member => ({label: member?.firstName + " " + member?.lastName, value: member._id})) : [])
    const [selectedContactList, setSelectedContactList] = useState(dealsData ? dealsData?.linkedCustomer?.contacts?.map(contact => ({label: contact?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue || " ", value: contact._id})) : [])
   
    
    const handleInputChange = ({label, value})=>{
        setTaskInput(prev => ({...prev, [label]: value}));
    }
    const handleCallInputChange = ({label, value})=>{
        setCallInput(prev => ({...prev, [label]: value}));
    }

    useEffect(()=>{
        setCallInput(initCallData);
        setTaskInput(initTaskData);
    },[activeType])

    const validate = (values) => {
        const errors = {}
        console.log(values, "TASKK INPUT BFFR VALID");
        if(!values.assignedTo){
          errors.assignedTo = "Assignee is required"
        }
        if(!values.taskName){
          errors.taskName = "Task Name is required"
        }
        if(!values.linkedDeal){
          errors.linkedDeal = "Linked Deal is required"
        }
        if(!values.taskDueDate){
          errors.taskDueDate = "Task Due Date is required"
        }
        return errors;
      }

    const callValidate = (values) => {
        const errors = {}
        console.log(values, "CALL INPUT BFFR VALID");
        if(!values.assignedTo){
          errors.assignedTo = "Assignee is required"
        }
        if(!values.linkedCallContact){
          errors.linkedCallContact = "Contact is required"
        }
        if(!values.linkedDeal){
          errors.linkedDeal = "Linked Deal is required"
        }
        if(!values.callStartDate){
          errors.callStartDate = "Call Due Date is required"
        }
        if(!values.callDescription){
          errors.callDescription = "Call Description is required"
        }
        return errors;
      }


    useEffect(()=>{
        if(!dealsData){
            (async ()=>{
               const allDeals = await DealsAPI.getAllDeals();
               console.log("ALL DEALS :: ",allDeals);
               setDealsOptions(allDeals?.data?.data?.map(deal => ({label: deal?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue, value: deal._id})))
            })()
        }
        if(taskInput?.linkedDeal || callInput?.linkedDeal){
            (async ()=>{
                    let deals = taskInput?.linkedDeal ? await DealsAPI.getDealById(taskInput?.linkedDeal) : await DealsAPI.getDealById(callInput?.linkedDeal) ; 
                    if(deals?.status === 200){
                        let dealData = deals.data.data;
                        setAssigneeList(dealData?.linkedCustomer?.linkedTeam?.members.map(member => ({label: member?.firstName + " " + member?.lastName, value: member._id})));
                        if(activeType.toUpperCase() === "CALL"){
                            setSelectedContactList(dealData?.linkedCustomer?.contacts?.map(contact => ({label: contact?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue || " ", value: contact._id})))
                        }                
                    }
                
            })()
        }
    },[])

    useEffect(()=>{
       if(taskInput?.linkedDeal || callInput?.linkedDeal){
        (async ()=>{
            let deals = taskInput?.linkedDeal ? await DealsAPI.getDealById(taskInput?.linkedDeal) : await DealsAPI.getDealById(callInput?.linkedDeal);
            if(deals.status === 200){
                let dealData = deals.data.data;
                setAssigneeList(dealData?.linkedCustomer?.linkedTeam?.members.map(member => ({label: member?.firstName + " " + member?.lastName, value: member._id})));
                if(activeType.toUpperCase() === "CALL"){
                    setSelectedContactList(dealData?.linkedCustomer?.contacts?.map(contact => ({label: contact?.userValues?.find(userValue => userValue.labelName === "Contact Name")?.fieldValue || " ", value: contact._id})))
                }                
            }
        })()
       }
    },[chooseDealToggle])


      useEffect(()=>{
        if(submitActivity){
            console.log("in submit")
            if(activeType === "task"){
                const errors = validate(taskInput)
                setTaskErrors(errors)
                console.log("in submit err",errors)
                if(Object.entries(errors).length > 0){
                    setSubmitActivity(false);
                    return;
                }
            }else{
                const errors = callValidate(callInput)
                setCallErrors(errors)
                if(Object.entries(errors).length > 0){
                    setSubmitActivity(false);
                    return;
                }
            }
          
            try{
                (async()=>{
                    console.log(taskInput, "TASK INPUT");
                    console.log(callInput, "CALL INPUT");
                    setLoading(true);
                    if(activeType === "task"){
                        if(currentTaskData){
                            let createdActivity = await ActivityAPI.updateActivity(currentTaskData._id, {...taskInput, activityType: "TASK"});
                            if(createdActivity.status === 200){
                                if(allActivityPage){
                                    handleFilterActivities({setPageToOne: true})
                                }else{
                                    const activities =  await ActivityAPI.getDealActivities({dealId: taskInput.linkedDeal, type: "TASK"});
                                    setTaskList(activities?.data?.data)
                                } 
                            }
                            setLoading(false)
                        }else{
                            let createdActivity = await ActivityAPI.createActivity(taskInput.linkedDeal, {...taskInput, activityType: "TASK"}) 
                            if(createdActivity.status === 200){
                                if(allActivityPage){
                                    handleFilterActivities({clear: true})
                                }else{
                                    const activities =  await ActivityAPI.getDealActivities({dealId: taskInput.linkedDeal, type: "TASK"});
                                    setTaskList(activities?.data?.data)
                                } 
                            }
                            setLoading(false)
                        }
                        
                    }else{
                        if(currentTaskData){
                            let createdActivity = await ActivityAPI.updateActivity(currentTaskData._id, {...callInput, activityType: "CALL" } )
                            if(createdActivity.status === 200){
                                if(allActivityPage){
                                    handleFilterActivities({setPageToOne: true})
                                }else{
                                    const activities = await ActivityAPI.getDealActivities({dealId: callInput.linkedDeal, type: "CALL"});
                                    setTaskList(activities?.data?.data)
                                }                               
                            }
                            setLoading(false)
                        }else{
                            let createdActivity = await ActivityAPI.createActivity(callInput.linkedDeal, {...callInput, activityType: "CALL" }) 
                            if(createdActivity.status === 200){
                                if(allActivityPage){
                                     handleFilterActivities({clear: true})
                                }else{
                                    let activities = await ActivityAPI.getDealActivities({dealId: callInput.linkedDeal, type: "CALL"});                                
                                    setTaskList(activities?.data?.data)
                                }
                            }
                            setLoading(false)
                        }
                    }
                    if(cb){
                        cb(activeType)
                    }
                    setLoading(false)
                    setSubmitActivity(false)
                    handleModalClose()
                })()
            }catch(err){
                setLoading(false)
                setSubmitActivity(false)
                console.error("activ error: ",err);
            }
        }
      },[submitActivity])


    return (
        <div className='px-20px py-16px'>
             {!currentTaskData &&   <div className='d-flex-center w-150px h-32px cursor'>    
                    <div onClick={()=>setActiveType("call")} className={`d-flex px-6px py-4px gap-10px br-left purple-right-border ${activeType === "call" ? 'active-left' : 'grey-left' }`}>
                        <i class="ri-phone-line fs-24px lh-24px"></i>            
                        <p className='color-grey-900 fs-16px mr-6px'>Call</p>
                    </div>
                    <div onClick={()=>setActiveType("task")} className={`d-flex activate-right gap-10px px-6px py-4px br-right ${activeType === "task" ? 'active-right' : 'grey-right' }`}>
                        <i class="ri-task-line fs-24px lh-24px"></i>
                        <p className='color-grey-900 fs-16px'>Task</p>
                    </div>
                </div>}
                {loading ? <Loader /> : 
                activeType === "task" ?
                   <div className='d-flex flex-column mt-24px'>
                    {console.log(dealsOptions, "OPTIONS")}
                   {
                   !dealsData && dealsOptions && <>
                   <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Choose Deal</label>
                    <Select 
                           isDisabled={currentTaskData ? true : false}
                           name="assignedTo"
                           onChange={(chosenOption)=>{
                               setChooseDealToggle(prev => !prev);
                               setTaskInput(prev => ({...prev, assignedTo: ""}));
                               setCallInput(prev => ({...prev, assignedTo: "", linkedCallContact: ""}));
                               handleInputChange({value: chosenOption.value, label: "linkedDeal" })
                           }}
                           options={dealsOptions}
                           components={{
                               IndicatorSeparator: () => null,
                           }}
                           value={ taskInput?.linkedDeal ? 
                                {label: dealsOptions?.find(deal => deal.value === taskInput.linkedDeal)?.label, 
                                value: dealsOptions?.find(deal => deal.value === taskInput.linkedDeal)?.value} : 
                                null}
                           styles={{
                               control: (baseStyles, state) => ({
                                   ...baseStyles,
                                   backgroundColor: taskErrors.linkedDeal ? 'var(--error-50)' : 'transparent',
                                   borderColor: taskErrors.linkedDeal ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                               }),
                           }}
                       />
                       {taskErrors.linkedDeal && <p className='error-txt'>{taskErrors.linkedDeal}</p>}
                       </>}

                       <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Assigned To</label>
                       {console.log("idk anymore : ",activeType, activeType.toUpperCase()==="TASK", taskInput?.linkedDeal)}
                       <Select 
                           isDisabled={ !(activeType.toUpperCase()==="TASK" && taskInput?.linkedDeal) }
                           name="assignedTo"
                           onChange={(chosenOption)=>{
                               handleInputChange({value: chosenOption.value, label: "assignedTo" })
                           }}
                           options={assigneeList}
                           components={{
                               IndicatorSeparator: () => null,
                           }}
                           value={ taskInput?.assignedTo && assigneeList ? 
                                {label: assigneeList?.find(user => user.value === taskInput.assignedTo)?.label, 
                                value: assigneeList?.find(user => user.value === taskInput.assignedTo)?.value} : 
                                null}
                           styles={{
                               control: (baseStyles, state) => ({
                                   ...baseStyles,
                                   backgroundColor: state.isDisabled? 'var(--grey-200)' : taskErrors.assignedTo ? 'var(--error-50)' : 'transparent',
                                   borderColor: taskErrors.assignedTo ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                               }),
                           }}
                       />
                       {taskErrors.assignedTo && <p className='error-txt'>{taskErrors.assignedTo}</p>}

                       <label className='fw-500 mb-6px mt-24px' htmlFor="taskName">Task Name</label>
                       <input 
                        className={`h-40px py-8px px-12px br-6px input-styles ${taskErrors.taskName ? 'error-input' : '' }`} 
                        value={taskInput?.taskName}
                        onChange={(e)=>handleInputChange({label: 'taskName', value: e.target.value})} 
                        placeholder={`Type the Task Name`}
                        type='text'/>
                        {taskErrors?.taskName && <p className='error-txt'>{taskErrors?.taskName}</p>}

                    <label className='fw-500 mb-6px mt-24px' htmlFor="taskDueDate">Due Date</label>
                    <DatePickerGroup handleInputChange={handleInputChange} activeType={activeType} taskErrors={taskErrors} taskInput={taskInput} dealId={dealId} />
                    <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Task Description</label>
                    <textarea style={{height: `68px`, resize: 'none'}} className={`py-8px px-12px br-6px input-styles w-100 mb-24px ${taskErrors?.taskDescription ? 'error-input' : ''}`}
                        name="taskDescription"
                        value={taskInput?.taskDescription}
                        onChange={(e)=>handleInputChange({value: e.target.value, label: 'taskDescription'})} placeholder='Type a Description' type='text'/> 
                    <div className='d-flex gap-8px mt-12px'>
                        <img
                            className='cursor'
                            onClick={() => handleInputChange({value: taskInput?.priority === "HIGH" ? "NORMAL" : "HIGH", label: "priority"})}
                            src={taskInput?.priority === "HIGH" ? CheckedBox : UncheckedBox}
                        />
                        <p
                            onClick={() => handleInputChange({value: taskInput?.priority === "HIGH" ? "NORMAL" : "HIGH", label: "priority"})}
                            className='color-grey-900 fs-16px cursor'>
                            Make this high priority
                        </p>
                    </div>

                  </div> :  
               <div className='d-flex flex-column mt-24px'>
                 {
                   !dealsData && dealsOptions && <>
                   <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Choose Deal</label>
                    <Select 
                           name="assignedTo"
                           onChange={(chosenOption)=>{
                               setChooseDealToggle(prev => !prev);
                               setTaskInput(prev => ({...prev, assignedTo: ""}));
                               setCallInput(prev => ({...prev, assignedTo: "", linkedCallContact: ""}));
                               handleCallInputChange({value: chosenOption.value, label: "linkedDeal" })
                           }}
                           options={dealsOptions}
                           components={{
                               IndicatorSeparator: () => null,
                           }}
                           value={ callInput?.linkedDeal ? 
                                {label: dealsOptions.find(deal => deal.value === callInput.linkedDeal)?.label, 
                                value: dealsOptions.find(deal => deal.value === callInput.linkedDeal)?.value} : 
                                null}
                           styles={{
                               control: (baseStyles, state) => ({
                                   ...baseStyles,
                                   backgroundColor: callErrors.linkedDeal ? 'var(--error-50)' : 'transparent',
                                   borderColor: callErrors.linkedDeal ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                               }),
                           }}
                       />
                       {callErrors.linkedDeal && <p className='error-txt'>{callErrors.linkedDeal}</p>}
                       </>}
                   <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Assigned To</label>
                       {console.log(activeType , "CALL ASSIGNEE", callInput)}
                       <Select 
                           name="assignedTo"
                           isDisabled={!(activeType.toUpperCase()==="CALL" && callInput?.linkedDeal)}
                           onChange={(chosenOption)=>{
                               handleCallInputChange({value: chosenOption.value, label: "assignedTo" })
                           }}
                           options={assigneeList}
                           components={{
                               IndicatorSeparator: () => null,
                           }}
                           value={ callInput?.assignedTo ? 
                            {label: assigneeList.find(user => user.value === callInput?.assignedTo)?.label, 
                            value: assigneeList.find(user => user.value === callInput?.assignedTo)?.value} : 
                            null}
                           styles={{
                               control: (baseStyles, state) => ({
                                   ...baseStyles,
                                   backgroundColor: state.isDisabled ? 'var(--grey-200)' : callErrors?.assignedTo ? 'var(--error-50)' : 'transparent',
                                   borderColor: callErrors?.assignedTo ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                               }),
                           }}
                       />
                       {callErrors.assignedTo && <p className='error-txt'>{callErrors.assignedTo}</p>}

                       <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Call To/From</label>
                       <Select 
                            isDisabled={!(activeType.toUpperCase()==="CALL" && callInput?.linkedDeal)}
                           name="linkedCallContact"
                           onChange={(chosenOption)=>{
                               handleCallInputChange({value: chosenOption.value, label: "linkedCallContact" })
                           }}
                           options={selectedContactList}
                           components={{
                               IndicatorSeparator: () => null,
                           }}
                           value={callInput?.linkedCallContact ? {
                            label: selectedContactList.find(contact => contact.value === callInput?.linkedCallContact)?.label || " ", 
                            value: selectedContactList.find(contact => contact.value === callInput?.linkedCallContact)?.value} : null}
                           styles={{
                               control: (baseStyles, state) => ({
                                   ...baseStyles,
                                   backgroundColor: state.isDisabled ? 'var(--grey-200)' : callErrors?.linkedCallContact ? 'var(--error-50)' : 'transparent',
                                   borderColor: callErrors?.linkedCallContact ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                               }),
                           }}
                       />
                        {callErrors.linkedCallContact && <p className='error-txt'>{callErrors.linkedCallContact}</p>}

                       <div className='d-flex gap-6px'>
                            <div>
                                <label className='fw-500 mb-6px mt-24px' htmlFor="callStartDate">Start Date</label>
                                <DatePickerGroup handleCallInputChange={handleCallInputChange} activeType={activeType} callErrors={callErrors} callInput={callInput} dealId={dealId} />
                            </div>
                            <div>
                                <label className='fw-500 mb-6px mt-24px' htmlFor="callStartTime">Start Time</label>
                                <TimePickerGroup handleCallInputChange={handleCallInputChange} callErrors={callErrors} callInput={callInput} />
                            </div>
                       </div>
 
                    <label className='fw-500 mb-6px mt-24px' htmlFor="assignedTo">Call Description</label>
                    <textarea style={{height: `68px`, resize: 'none'}} 
                        className={`py-8px px-12px br-6px input-styles w-100 mb-24px `}
                        name="callDescription"
                        value={callInput?.callDescription}
                        onChange={(e)=>handleCallInputChange({value: e.target.value, label: 'callDescription'})} placeholder='Type Description' type='text'/> 
                       { callErrors?.callDescription && <p className='error-txt'>{callErrors?.callDescription}</p>}
                    

                    <div className='d-flex gap-8px mt-12px'>
                        <img
                            className='cursor'
                            onClick={() => handleCallInputChange({value: callInput?.priority === "HIGH" ? "NORMAL" : "HIGH", label: "priority"})}
                            src={callInput?.priority === "HIGH" ? CheckedBox : UncheckedBox}
                        />
                        <p
                            onClick={() => handleCallInputChange({value: callInput?.priority === "HIGH" ? "NORMAL" : "HIGH", label: "priority"})}
                            className='color-grey-900 fs-16px cursor'>
                            Make this high priority
                        </p>
                    </div>
               </div> 
                
                }
             
        </div>
    );
};

const DatePickerGroup = ({handleInputChange, handleCallInputChange, taskErrors, callErrors, taskInput, callInput, dealId, activeType, onCalendarOpen, onCalendarClose}) => {
    console.log("dueeeee :",taskInput?.taskDueDate, moment(taskInput?.taskDueDate).format("DD/MM/YYYY"))
    const initStartDate = activeType === "task" ? !taskInput?.taskDueDate ? null: moment(taskInput?.taskDueDate).toDate() : !callInput?.callStartDate ? null: moment(callInput?.callStartDate ).toDate()
    const [startDate, setStartDate] = useState(initStartDate);
    const inputRef = useRef(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const onOpen = () => {
        setIsCalendarOpen(true)
    }

    const onClose = () => {
        setIsCalendarOpen(false)
    }

    return (
        <div style={{height: isCalendarOpen ? 448 : "auto"}}>
                <DatePicker 
                    customInput={ <CustomCalendarInput taskErrors={taskErrors} callErrors={callErrors} taskLabelName={"taskDueDate"} activeType={activeType} callLabelName={"callStartDate"} inputRef={inputRef}/>}
                    dateFormat="dd/MM/yyyy"
                    selected={startDate}
                    onCalendarOpen={onOpen}
                    onCalendarClose={onClose}
                    popperContainer={(popperProps) => <div className={`position-relative`} {...popperProps}></div>}
                    popperPlacement='bottom-start'
                    onChange={(date)=>{
                        console.log(date, "PICKER DATE");
                        setStartDate(date)
                        console.log("ACTIVE TYPE CUREN : ",activeType)
                        if(activeType === "task"){
                            handleInputChange({value: moment(date).format('DD/MM/YYYY'), label: "taskDueDate"})
                        }else{
                            handleCallInputChange({value: moment(date).format('DD/MM/YYYY'), label: "callStartDate"})
                        }
                    }} 
                />
                {activeType === "task" ? taskErrors?.taskDueDate && <p className='error-txt'>{taskErrors?.taskDueDate}</p> : 
                callErrors?.callStartDate && <p className='error-txt'>{callErrors?.callStartDate}</p>}
        </div>
    )
}

const TimePickerGroup = ({handleCallInputChange, callErrors, callInput}) => {
    const initStartTime = !callInput?.callStartTime ? null: moment(callInput?.callStartTime, "HH:mm:ss").valueOf()
    const [startTime, setStartTime] = useState(initStartTime);
    const inputRef = useRef(null);

    return (
        <div>
               <DatePicker
                    selected={startTime}
                    customInput={ <CustomTimeInput callErrors={callErrors} callLabelName={"callStartTime"} inputRef={inputRef}/>}
                    onChange={(time) => {
                        console.log(time, "DATE PICK VALUE");
                        setStartTime(time)
                        handleCallInputChange({label: "callStartTime", value: moment(time).format('HH:mm:ss')})}}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                />
                {callErrors?.callStartTime && <p className='error-txt'>{callErrors?.callStartTime}</p>}
        </div>
    )
}

const CustomCalendarInput = forwardRef((props, ref) => {
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "40px", borderRadius: "6px", 
            
            backgroundColor:  props?.activeType === "task" ? 
             props?.taskErrors[props?.taskLabelName] ? "var(--error-50)" : "transparent" : 
             (props.callErrors && props?.callErrors[props?.callLabelName]) ?  "var(--error-50)" : "transparent" , 

            border: props?.activeType === "task" ?
             props?.taskErrors?.taskDueDate ? "1px solid var(--error-500)" : "1px solid var(--grey-300, #D0D5DD)"
            : props?.callErrors?.callStartDate ? "1px solid var(--error-500)" : "1px solid var(--grey-300, #D0D5DD)" }} 
            {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "8px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} className="ri-calendar-event-line"></i>
        </div>
    );
  });

const CustomTimeInput = forwardRef((props, ref) => {
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "40px", borderRadius: "6px", 
            
            backgroundColor: props?.callErrors?.callStartTime ?  "var(--error-50)" : "transparent" , 

            border: props?.callErrors?.callStartTime ? "1px solid var(--error-500)" : "1px solid var(--grey-300, #D0D5DD)" }} 
            {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "8px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} className="ri-time-line"></i>
        </div>
    );
  });

export default NewActivityForm;