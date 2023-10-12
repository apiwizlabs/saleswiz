import React, { useEffect, useState, useRef, forwardRef } from 'react'
import {Plus, FunnelSimple, Compass} from "@phosphor-icons/react";
import PipelineCard from './components/PipelineCard';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import SideModal from '../../components/Modals/SideModal';
import NewDealForm from './NewDealForm';
import { DealsAPI, LeadsAPI, PipelinesAPI, TeamAPI, TemplateAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import { useOutletContext } from 'react-router';
import DefaultTableView from "./DealTableView.js"
import Select from 'react-select';
import { ACTIVE_ROLES, ADMIN_SALES, ADMIN_ROLES, PageSize } from '../../utils/constants';
import DatePicker from "react-datepicker";
import {countKeysWithDifferentValues } from '../../utils';
import moment from 'moment';


export default function Pipelines() {
    const [draggedItem, setDraggedItem] = useState('')
    const [dragStart, setDragStart] = useState(false);
    const [newDealToggle, setNewDealToggle] = useState(false);
    const [submitDeal, setSubmitDeal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dealsData, setDealsData] = useState({});
    const [leadsOptions, setLeadsOptions] = useState([]);
    const [teamsOptions, setTeamsOptions] = useState([]);
    const [stageHeadings, setStageHeadings] = useState([]);
    const [editDealToggle, setEditDealToggle] = useState({show: false, data: null});
    const [currentUserData, setCurrentUserData] = useOutletContext()
    const [toggleFilterModal, setToggleFilterModal] = useState(false);
    const [activeFilterCount, setActiveFiltersCount] = useState("");
    const initialFilterData = {customersIdList: [], teamsIdList: [], dateFrom:"", dateTo: "", pageSize: PageSize, currentPage: 1}
    const initDateDetails = {dateFrom : "", dateTo: ""};
    const [filterData, setFilterData] = useState(initialFilterData)   
    const [dateDetails, setDateDetails] = useState(initDateDetails);
    const [dealsTableList, setDealsTableList] = useState([]);
    const inputRef = useRef(null);
    const inputRef2 = useRef(null);
    const [switchedState, setSwitchedState] = useState('BOARD')
    const [currentPage, setCurrentPage]= useState(1);



    const getAllDealsData = async () => {
        try{
            setLoading(true);
            const allDeals = await DealsAPI.getAllDeals({queries: {pageSize: PageSize, currentPage: currentPage }})
            console.log("ALL Deals DATA :: ",allDeals);
            if(allDeals.status === 200){
                setDealsTableList(allDeals?.data);    
            }
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const handleFilterDeals = async (argList) => {
        // console.log(filterData, "FINAL FILTER DATA")
        setActiveFiltersCount(countKeysWithDifferentValues(initialFilterData , filterData))
        const formatFilteredData = {
            ...filterData, 
            pageSize: PageSize,
            currentPage: argList?.newPage || 1,
            customersIdList: filterData?.customersIdList?.map(item => item.value), 
            teamsIdList: filterData?.teamsIdList?.map(item => item.value),
        }
        try{
            setLoading(true)
            if(argList?.clear){
                setCurrentPage(1);
                setFilterData(initialFilterData);
                setDateDetails(initDateDetails);
                setActiveFiltersCount(0);
                if(currentPage === 1){
                    const allDeals = await DealsAPI.getAllDeals({queries: initialFilterData});
                    if(allDeals.status === 200){
                        setDealsTableList(allDeals?.data)
                    }
                }
            }else{
                const allDeals = await DealsAPI.getAllDeals({queries: formatFilteredData});
                if(allDeals.status === 200){
                    setDealsTableList(allDeals?.data)
                }
            }
            setToggleFilterModal(false)
            setLoading(false)
        }catch(err){
            setToggleFilterModal(false)
            setLoading(false)
        }
    }


    const handleDrop = async (result) => {
        setDragStart(false)
        console.log("ITEM",result);
        const {source, destination} = result;
        if(!destination) return;
        if(destination.droppableId === source.droppableId && destination.index === source.index) return;

        let add = "";
        let _dealsData = dealsData;
        let sourceArr = _dealsData[source.droppableId]
        add = sourceArr[source.index];
        _dealsData[source.droppableId].splice(source.index, 1);
        _dealsData[destination.droppableId].splice(destination.index, 0, add)

        setDealsData(_dealsData);
        const firstColumnData =  _dealsData[source.droppableId].map(deal => deal._id);
        const secondColumnData =  _dealsData[destination.droppableId].map(deal => deal._id);
        console.log(firstColumnData, "FIRST COL", secondColumnData, "SECOND COL");
        try{
            await PipelinesAPI.updatePipelineData({firstColumnData, firstColumnStatus: source.droppableId, secondColumnData, secondColumnStatus: destination.droppableId, dealId: result.draggableId})
        }catch(err){
            console.error(err)
        }
    }

    const getPipelineData = async () => {
        try{
            setLoading(true)
            const pipelineData = await PipelinesAPI.getPipelineData();
            const {data: {data: dealFields}} = await TemplateAPI.getTemplateByType("deal");
            const tempOnlyLabels = dealFields.formFields?.filter(o => o.formTemplateType === "DEAL" && o.labelName === 'Select Stage')
            const onlyLabels = tempOnlyLabels.length ? tempOnlyLabels[0]?.valueOptions || [] : []
            let dealsSequence = pipelineData.data.data.pipelineSequence;
            const dealsStages = Object.keys(dealsSequence);
            for(let stage of onlyLabels){
                if(!dealsStages.includes(stage)){
                    dealsSequence[stage] = [];
                }
            }
            setDealsData(dealsSequence);
            setStageHeadings(onlyLabels);
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const getFilterData = async () => {
        console.log("DAWDD", 'called')
        try{
            setLoading(true)
            const teamsData = await TeamAPI.getAllTeams();
            const customersData = await LeadsAPI.getAllCustomers();
            if(customersData?.status === 200){
                // if(ADMIN_ROLES.includes(currentUserData?.userRole)){
                    setLeadsOptions(customersData?.data?.data.map(item => (
                        {   label: item.userValues.find(userValue => userValue.labelName === "Customer Name")?.fieldValue, 
                            value: item._id
                        })));                        
                // }else{
                //     let nestedCustomers = customersData?.data?.data.map(teamData => [ ...(teamData.customers || [])]);
                //     let arr1d = [].concat.apply([], nestedCustomers); //converting from 2d to 1d array
                //     console.log("ARR !D :: ",arr1d);
                //     setLeadsOptions(
                //         arr1d.map(item => ({
                //             label: item.userValues.find(userValue => userValue.labelName === "Customer Name")?.fieldValue, 
                //             value: item._id
                //         })
                //     )); 
                // }
            } 

            console.log("DAWDD", teamsData)
            if(teamsData?.status === 200){
                const _tempTeams = teamsData.data.data.map(team => ({label: team?.teamName, value: team._id}))
                setTeamsOptions(_tempTeams);
            }
            console.log("DATA BUnCH ::  ",teamsData, customersData)

            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error('DAWDD',err)
        }
    }

    const MultiValueContainer = props => {
        return null;
    };

  
    useEffect(()=>{
        getPipelineData();
        getFilterData();
        getAllDealsData()
    },[])

    useEffect(()=>{
        handleFilterDeals({newPage: currentPage})
    },[currentPage])

    useEffect(()=>{
        if(switchedState === "BOARD"){
            getPipelineData();
        }else{
            getAllDealsData()
        }
    },[switchedState])

  

    return (
        <div className='p-16px'>
            <div className='dfaic justify-content-between align-items-center'>
            {switchedState !== "BOARD" ? 
            <>
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
                                        handleFilterDeals({clear : true})
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



                            <button onClick={handleFilterDeals}  className='primary-btn fw-700 fs-14px w-100 h-40px mt-16px'>
                                Apply
                            </button>


                    
                        </div>
                    }
            </div>
            </>

          : <div></div>
            }
            <div className='d-flex'>
                <div className='switch-view d-flex-center mr-16px'>
                    <i onClick={()=>setSwitchedState("TABLE")} className={`ri-bar-chart-horizontal-line cursor fs-24px lh-24px ${switchedState === "TABLE" ? "active" : "" }`}></i>
                    <i className={`ri-layout-masonry-line fs-24px cursor lh-24px ${switchedState === "BOARD" ? "active" : "" }`} onClick={()=>setSwitchedState("BOARD")}></i>
                </div>

               {ACTIVE_ROLES.includes(currentUserData?.userRole) && <button onClick={()=>setNewDealToggle(true)} className='primary-btn h-40px px-12px py-10px br-6px d-flex-center'>
                    <i class="ri-add-line fs-20px lh-20px mr-8px"></i> 
                    Deal
                </button>}
                </div>
            </div>
             {newDealToggle && <SideModal  
                         modalType={"NEW"}
                heading={"Create Deal"} 
                onSubmit={()=>{
                    console.log("submitting");
                    setSubmitDeal(true);
                }} 
                onClose={()=>{
                    setNewDealToggle(false);
                    setSubmitDeal(false);
                }}  
                children={<NewDealForm submitDeal={submitDeal} setSubmitDeal={setSubmitDeal} getPipelineData={switchedState === "BOARD" ? getPipelineData : getAllDealsData} handleModalClose={()=>setNewDealToggle(false)}  />}/>}
            
             {editDealToggle?.show && <SideModal 
                         modalType={"EDIT"} 
                heading={"Edit Deal"} 
                onSubmit={()=>{
                    console.log("submitting");
                    setSubmitDeal(true);
                }} 
                onClose={()=>{
                    setEditDealToggle({show: false, data: null});
                    setSubmitDeal(false);
                }}  
                children={<NewDealForm submitDeal={submitDeal} setSubmitDeal={setSubmitDeal} getPipelineData={getPipelineData} handleModalClose={()=>setEditDealToggle({show: false, data: null})} dealId={editDealToggle?.data?._id}  />}/>}

            

            {/* Container section */}
          {loading ? <div style={{height: "50vw"}}><Loader /></div> :  
          switchedState === "BOARD" ?
          <div className='dfaic gap-12px pipelineContainer mt-24px'>
                <DragDropContext
                    onDragEnd={handleDrop}
                    onDragStart={(draggedItem) => {
                        setDragStart(true)
                        setDraggedItem(draggedItem);
                        console.log("drag started, item: ", draggedItem);
                    }}>
                    {stageHeadings && dealsData && 
                    stageHeadings.map((columnTitle, i) => {
                        return (
                            <Droppable droppableId={`${columnTitle}`}>
                                {(provided) => 
                                <div className='eachPipeline p-4px' key={i} {...provided.droppableProps} ref={provided.innerRef}>
                                    <div className='pipelineHeader'>
                                        <div className='titleSection' style={{height: 59}}>
                                            <div className='iconSection d-flex-center'>
                                                {/* <Compass size={16} color='#731EE2' weight='bold' /> */}
                                                <i className='ri-arrow-right-double-line color-primary-800 fs-16px'></i>
                                            </div>

                                            <div className='ms-3'>
                                                <p className='fs-16px fw-500 text-gray-900'>{columnTitle}</p>
                                                {/* <p className='fs-14px fw-500 text-gray-900'>
                                                    $2,234,544 • <span className='fs-14px fw-400'>3 Details</span>
                                                </p> */}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='mt-16px pipelineBody'>
                                        <div>
                                            {console.log(dealsData[columnTitle], "LINE 108888")}
                                            {dealsData && dealsData[columnTitle]?.length > 0 && dealsData[columnTitle]
                                            .map((deal, i) => (
                                                <PipelineCard key={deal._id} i={i} _id={deal._id} deal={deal} setEditDeal={setEditDealToggle}/>
                                            ))}
                                        </div>
                                    </div>
                                    {provided.placeholder}
                                </div>}
                            </Droppable>
                        )
                    })}
                </DragDropContext>
            </div> : <DefaultTableView  handleFilterDeals={handleFilterDeals} dealsTableList={dealsTableList} getAllDealsData={getAllDealsData} setDealsTableList={setDealsTableList} currentPage={currentPage} setCurrentPage={setCurrentPage} />}

        </div>
    )
}


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
