import React, { useState, useRef, useEffect } from 'react';
import useOutsideClick from '../../../utils/useOutsideClick';
import { useNavigate, useParams, useOutletContext } from 'react-router';
import CrownIcon from "../../../assets/icons/crown.svg";
import HorizontalTimeline from '../components/StageTimeline';
import { DealsAPI, TemplateAPI, UserAPI } from '../../../api/apiConfig';
import { ACTIVE_ROLES, ADMIN_ROLES } from '../../../utils/constants';
import { Loader } from '../../../components/Loader';
import { capitalizeFirstLetters } from '../../../utils';
import Overview from '../components/Overview';
import Notes from '../components/Notes';
import Activities from '../components/Activities';
import Files from '../components/Files';
import SideModal from '../../../components/Modals/SideModal';
import NewDealForm from '../NewDealForm';
import { objectDeepClone } from '../../../utils';

const DealDetails = () => {

    const tabs = ["Overview", "Notes", "Activities", "Files"];
    const {dealId} = useParams();
    const [currentUserData, _] = useOutletContext();
    const [editDealToggle, setEditDealToggle] = useState({show: false, data: null});

    const navigate = useNavigate();
    const deleteRef = useRef(null);
    const [toggleDelete, setToggleDelete] = useState(false); 
    const [dealsData, setDealsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [additionalInfo, setAdditionalInfo] = useState(false); 
    const [toggleDescription, setToggleDescription] = useState(false); 
    const [submitDeal , setSubmitDeal] = useState(false);
    const [activeSection, setActiveSection] = useState(tabs[0]);
    const [stagesList, setStagesList] = useState([]);
    const [allUsersData, setAllUsersData] = useState([]);


    useOutsideClick(deleteRef, ()=>{
        setToggleDelete(false);
    })

    const getDealById = async () => {
        try{
            setLoading(true)
            const dealDetails = await DealsAPI.getDealById(dealId);
            const allUsers = await UserAPI.getAllUsers()
            if(allUsers?.status === 200){
                console.log(allUsers?.data?.data?.users, "USERS DATA");
                setAllUsersData(allUsers?.data?.data?.users.map(item => ({id: item._id, name: item?.firstName+" "+item?.lastName})))
            }
            console.log("SINGLE DEAL DATA :: ",dealDetails);
            setDealsData(dealDetails?.data?.data);
            setLoading(false);

        }catch(err){
            console.log(err);
            setLoading(false)
        }
    }

    const handleDelete = async (dealId) => {
        try{
            setLoading(true)
            const dealDetails = await DealsAPI.deleteDeal(dealId);
            navigate('/')
            setLoading(false);

        }catch(err){
            console.log(err);
            setLoading(false)
        }
    }



    const getStages = async () => {
        const {data: {data: dealFields}} = await TemplateAPI.getTemplateByType("deal");
        const tempOnlyLabels = dealFields.formFields?.filter(o => o.formTemplateType === "DEAL" && o.labelName === 'Select Stage')
        const onlyLabels = tempOnlyLabels.length ? tempOnlyLabels[0]?.valueOptions || [] : []
        setStagesList(onlyLabels);
    }

    
    useEffect(()=>{
        if(dealId){
            getDealById()
            getStages()
        }
    },[dealId])


    return (
        <div className='p-16px h-100 '>
            {loading ? <Loader /> : 
            dealsData?.userValues?.length > 0 ? <>
            <div className='d-flex justify-content-between align-items-center mb-24px'>
                <div className='d-flex align-items-center gap-12px'>
                    <i onClick={()=>navigate("/")} className="ri-arrow-left-line fs-24px lh-24px cursor"></i>
                    <p className='color-grey-900 fw-500 fs-24px'>{dealsData?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue}</p>
                </div>
                <div className='d-flex gap-17px align-items-center mr-4px position-relative'>
                    <SalesOwnerName dealsData={dealsData} />
                    { ACTIVE_ROLES.includes(currentUserData?.userRole) &&  
                    <div onClick={()=>{
                        setEditDealToggle({show: true, data: dealsData})
                    }} className='grey-box cursor'><i className="ri-pencil-line fs-16px lh-16px"></i></div>}
                   {ADMIN_ROLES.includes(currentUserData?.userRole) && <i onClick={()=>{setToggleDelete(prev => !prev)}} className="ri-more-2-fill cursor"></i>}
                    {toggleDelete && 
                        <div ref={deleteRef} className='table-dropdown position-absolute d-flex flex-column gap-5px'>
                            <p onClick={(e)=>{
                                setToggleDelete(false)
                                handleDelete(dealsData._id)
                            }} className='table-dropdown-item'>Delete Deal</p>
                        </div>
                    }
                </div>
            </div>
           {dealsData?.userValues?.find(userValue => userValue.labelName === "Select Stage")?.fieldValue && stagesList &&
            <div className='d-flex mx-70px mb-52px'>
                <HorizontalTimeline stages={stagesList} 
                currentStage={dealsData?.userValues?.find(userValue => userValue.labelName === "Select Stage")?.fieldValue || ""} />
            </div>}
            <div className='d-flex grey-divider pt-8px px-12px grey-border-top'>
                {tabs.map(tab => {
                    return (
                        <div onClick={()=>setActiveSection(tab)} className={`px-24px py-8px cursor ${activeSection === tab ? 'active-border-bottom' : ''}`}>
                            <p className={`fs-14px color-grey-700`}>{tab}</p>
                        </div>
                    )
                })}
            </div>

            <div style={{height: `calc(100% - 200px)`}} className='w-100 bg-grey-200 p-16px d-flex-center'>
               {
                activeSection === "Overview" ? <Overview allUsersData={allUsersData} dealsData={objectDeepClone(dealsData)} /> : 
                activeSection === "Notes" ? <Notes /> : 
                activeSection === "Activities" ? <Activities dealsData={dealsData}  /> :
                activeSection === "Files" ? <Files  /> : null
               }
            </div>
            </> : <p>No Data Yet</p>}

            {editDealToggle?.show && <SideModal  
                heading={"Edit Deal"} 
                modalType={"EDIT"}
                onSubmit={()=>{
                    console.log("submitting");
                    setSubmitDeal(true);
                }} 
                onClose={()=>{
                    setEditDealToggle({show: false, data: null});
                    setSubmitDeal(false);
                }}  
                children={<NewDealForm submitDeal={submitDeal} setSubmitDeal={setSubmitDeal} getPipelineData={getDealById} handleModalClose={()=>setEditDealToggle({show: false, data: null})} dealId={editDealToggle?.data?._id}  />}/>}
        </div>
    );
};


const SalesOwnerName = ({dealsData}) => {
    console.log(dealsData, "INIde component");
    const salesOwnerDetails = dealsData?.linkedCustomer?.linkedTeam?.members?.find((member) => member.role === 'SALES_OWNER')
    console.log(salesOwnerDetails, "SALeS owner details");
    return (
        <div className='pink-box d-flex-center'><img src={CrownIcon} style={{marginRight: "8px"}} width="24" height="24" /> 
            <div style={{marginRight: "4px"}} className='iconSectionImage'>
                <img src={`https://xsgames.co/randomusers/avatar.php?g=pixel`} width="24px" height="24px" className='roundedImage' />
            </div>
            {salesOwnerDetails ? <p className='fs-14px lh-24px'>{salesOwnerDetails?.firstName + " " + (salesOwnerDetails?.lastName || "") }</p> : <p></p>}
        </div>
    )
}

export default DealDetails;