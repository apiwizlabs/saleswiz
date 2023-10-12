import React , {useState, useEffect, useRef} from 'react';
import { DealsAPI } from '../../api/apiConfig';
import { useOutletContext } from 'react-router';
import NewDealForm from './NewDealForm';
import { ADMIN_ROLES, ACTIVE_ROLES, TEAM_LEADS } from '../../utils/constants';
import { Loader } from '../../components/Loader';
import SideModal from '../../components/Modals/SideModal';
import { useNavigate } from 'react-router';
import useOutsideClick from "../../utils/useOutsideClick"
import {toast} from 'react-toastify';
import moment from 'moment';
import Pagination from '../../components/Pagination';
import { PageSize } from '../../utils/constants';



const DealTableView = ({getAllDealsData, dealsTableList, setDealsTableList, getPipelineData, currentPage, setCurrentPage, handleFilterDeals}) => {
    const [loading, setLoading] = useState(false);
    const [editToggleModal , setEditToggleModal] = useState(false);
    const [selectedDealId, setSelectedDealId] = useState(false);
    const [showAddDeal, setShowAddDeal] = useState(false);
    const [submitDeal, setSubmitDeal] = useState(false);
    const [submitEditDeal, setSubmitEditDeal] = useState(false);
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [dealId, setDealId] = useState("")


    return (
    <div>
        <div className='p-16px'> 
                {loading ? <Loader /> : 
        dealsTableList && dealsTableList?.data?.length > 0 ? 
        <div>
            <table className='mt-17px'>
                <tr>
                    <th className='fs-14px fw-400 color-grey-600'>Deal Name</th>
                    <th className='fs-14px fw-400 color-grey-600'>Linked Customer</th>
                    <th className='fs-14px fw-400 color-grey-600'>Team Name</th>
                    <th className='fs-14px fw-400 color-grey-600'>Sales Owner</th>
                    <th className='fs-14px fw-400 color-grey-600'>Created time</th>
                </tr>
                {dealsTableList?.data?.map(deal => {
                    return (
                        <TableRow getPipelineData={getPipelineData} getAllDealsData={getAllDealsData} deal={deal} setEditToggleModal={setEditToggleModal} setDealId={setDealId} setLoading={setLoading}  />
                    )
                })}
            </table> 
            <div className='d-flex-center' style={{marginTop: "30px"}}>
                <Pagination
                className="pagination-bar"
                currentPage={currentPage}
                totalCount={dealsTableList?.totalCount}
                pageSize={PageSize}
                onPageChange={page => setCurrentPage(page)}
                />
            </div>
            </div>
            : <p className='text-center'>No Items Yet</p>
            }
                {showAddDeal && <SideModal  
                            modalType={"NEW"}
                heading={"Add Deal"} 
                onSubmit={()=>{
                    setSubmitDeal(true);
                }} 
                onClose={()=>{ 
                    setShowAddDeal(false);
                    setSubmitDeal(false);
                }}  
                children={<NewDealForm currentPage={currentPage} handleFilterDeals={handleFilterDeals} submitDeal={submitDeal} getPipelineData={getAllDealsData} setSubmitDeal={setSubmitDeal} handleModalClose={()=>setShowAddDeal(false)}  />}/>}
            {editToggleModal && 
            <SideModal heading="Edit Deal"  
            modalType={"EDIT"} 
                onSubmit={()=>{
                    setSubmitDeal(true);
                }}  
                onClose={()=>{
                    setEditToggleModal(false);
                    setSubmitDeal(false);
                }}  
                children={<NewDealForm setCurrentPage={setCurrentPage} currentPage={currentPage} handleFilterDeals={handleFilterDeals} dealId={dealId} getPipelineData={getAllDealsData} submitDeal={submitDeal} setSubmitDeal={setSubmitDeal}  handleModalClose={()=>setEditToggleModal(false)}  />} />}
        </div>
    </div>
    );

};


const TableRow = ({deal, setDealId, setEditToggleModal, setLoading, getAllDealsData, getPipelineData}) => {
    const navigate = useNavigate()
    const [currentUserData, setCurrentUserData] = useOutletContext();    
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const dealName = deal?.userValues?.find(item => item.labelName === "Deal Name").fieldValue;
    const salesOwner = deal?.linkedCustomer?.linkedTeam?.members.find(member => member.role === "SALES_OWNER");
    const [activeRow, setActiveRow] = useState(false);


    useOutsideClick(dropdownRef, ()=>{
        setShowDropdown(false);
        setActiveRow(false)
    })

    const handleDeleteDeal = async (dealId) => {
        try{
            setLoading(true)
           const deletedTeam = await DealsAPI.deleteDeal(dealId)
           if(deletedTeam.status === 200){
                getAllDealsData()
                getPipelineData()
                setLoading(false);
                toast.success("Deal has been deleted");
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
        onClick={()=>navigate(`/deals/${deal._id}`)} className='cursor'>
        <td>{dealName || <span className='color-warning-700'>Required: Add a field labeled 'Deal Name'</span>}</td>
        <td>{
        ADMIN_ROLES.includes(currentUserData?.userRole) ? 
        deal?.linkedCustomer?.userValues?.find(userValue => userValue.labelName === "Customer Name")?.fieldValue 
        : deal?.customerName
        }
        </td>
        <td>{ ADMIN_ROLES.includes(currentUserData?.userRole) ?  (deal?.linkedCustomer?.linkedTeam?.teamName || "") : deal?.teamName}</td>
        <td>{ADMIN_ROLES.includes(currentUserData?.userRole) ? (salesOwner?.firstName + " "+ salesOwner?.lastName) : deal?.salesOwnerName}</td>
        <td className=' position-relative'>
            <div className='d-flex h-100 justify-content-between'>
            {moment(deal.mts).format('MMM DD, YYYY hh:mm A')}
          
          {  activeRow && (ADMIN_ROLES.includes(currentUserData?.userRole) || TEAM_LEADS.includes(currentUserData?.userRole) ) && 
          <div className='d-flex align-items-center h-100 position-absolute table-action-btn secondary display-on-parent'>
              { <i onClick={(e)=>{
                  e.stopPropagation()
                  setEditToggleModal(prev => !prev);
                  setDealId(deal._id)
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
                          handleDeleteDeal(deal._id)}} className='table-dropdown-item'>Delete Deal</p>
                  </div>)}
              </div>}
          </div> }  
            </div>
                                                                                                                                                      
        </td>
        
    </tr>
    )
}

export default DealTableView;