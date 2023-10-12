import React, { useState } from 'react'
import CustomIcons from '../../../components/CustomIcons'
import { PencilLine, PencilSimple, Timer } from '@phosphor-icons/react'
import { Draggable } from "react-beautiful-dnd";
import getSymbolFromCurrency from 'currency-symbol-map'
import moment from 'moment';
import { useNavigate } from 'react-router';
import { useOutletContext } from 'react-router';
import { ACTIVE_ROLES } from '../../../utils/constants';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Tooltip } from 'react-tooltip';

export default function PipelineCard({_id, i, deal, setEditDeal}) {
    console.log('deal', deal)
    const [activeCard, setActiveCard] = useState(false);
    const navigate= useNavigate();
    const [currentUserData, setCurrentUserData] = useOutletContext()

    const contractAmount= deal.userValues.find(userValue => userValue.labelName === "Total Contract Amount")?.fieldValue || "";
    const dealName = deal.userValues.find(userValue => userValue.labelName === "Deal Name")?.fieldValue;
    const isPending = deal.userValues.find(userValue => userValue?.approvalFieldId?.status === "PENDING")
    const teamMembers = deal?.linkedCustomer?.linkedTeam?.members;
    const soData = teamMembers?.find(member => member?.role === "SALES_OWNER")

    


    return (
        <Draggable key={_id} draggableId={_id} index={i}>
            {(provided) => (
            <div onClick={()=>navigate(`/deals/${deal._id}`)} onMouseEnter={()=>setActiveCard(true)} onMouseLeave={()=>setActiveCard(false)} className='pipelineCard' 
                ref={provided.innerRef}
                {...provided.dragHandleProps}
                {...provided.draggableProps} >
                <div className={`dfaic jcb ${!teamMembers?.length > 0 ? 'h-14px': ''}`}>
                    { teamMembers?.length > 0 ? 
                        <div className='iconSection'>
                            <CustomIcons type={'crown'} />
                           {teamMembers.find(member => member?.role === "SALES_OWNER") &&
                           <div className='iconSectionImage'>
                            
                            {soData?.profilePicture?.url ? 
                            <img src={soData?.profilePicture?.url} className='roundedImage' />
                            :   <div className='name-pic roundedImage d-flex-center color-grey-600 fs-12px w-24px h-24px fw-700'>{soData?.firstName[0]?.toUpperCase()}</div>  
                            }
                                
                            </div>}
                        </div> 
                        : <div className=''></div>
                    }

                    <div className='actionBtns'>
                       {ACTIVE_ROLES.includes(currentUserData?.userRole) && activeCard && <div 
                        onClick={(e)=>{
                            e.stopPropagation()
                            setEditDeal({show: true, data: deal});
                        }} 
                        className='bg-gray-100 px-4px br-100'>
                            <i class="ri-pencil-line color-primary-800 fs-14px lh-14px"></i>
                        </div>}
                    </div>
                </div>
                {isPending && <p className='color-grey-500 fw-700 fs-12px mt-2 d-flex align-items-center'><i className="ri-alert-line color-warning-500 fs-20px lh-20px"></i><p className='ms-1'>Approval Pending</p></p>}

                <div className='my-20px'>
                   {dealName ? <p className='text-gray-900 fs-20px fw-500 truncated w-264px'>
                        {dealName}
                    </p> : <span className='color-warning-700 fs-14px text-wrap'>Warning: `Deal Name` field label is Required</span>}
                    <p className='text-gray-500 fs-14px fw-500'>
                        {/* $2,234,544 */}
                        {contractAmount ? <p className='fs-14px color-grey-500 fw-500'>{getSymbolFromCurrency(contractAmount[1]) +  contractAmount[0]}</p> : ""}
                    </p>
                </div>

                <div className='dfaic jcb'>
                {console.log("TEAMMEMBS",deal?.linkedCustomer?.linkedTeam)}

                {teamMembers?.length > 0 && 
                    <div  data-tooltip-id="my-tooltip1" data-tooltip-content={`${deal?.linkedCustomer?.linkedTeam?.teamName}`}  className='imagesOverlapSection'>
                        {teamMembers?.filter(member => member.role !== "SALES_OWNER")
                        .slice(0, 4)
                        .map(member => {
                            console.log("member each ",member);
                            if(member?.profilePicture?.url){
                            return (<div>
                                <img src={member?.profilePicture?.url} alt='' className='roundedImage' style={{zIndex: i+1}} />
                            </div>)
                            }else{
                            return (
                            <div  style={{zIndex: i+1}} 
                            className='name-pic-1 roundedImage d-flex-center color-grey-600 fs-12px w-24px h-24px fw-700'>
                                {member?.firstName[0]?.toUpperCase()}
                            </div>  
                            )}
                        }
                        )}
                          {teamMembers?.filter(member => member.role !== "SALES_OWNER")?.length > 4 && 
                          <div style={{zIndex: 6}} className='roundedImage custTag1 bg-gray-600'>
                                <p className='fs-12px text-gray-600 fw-700'>+{teamMembers?.filter(member => member.role !== "SALES_OWNER")?.length - 4}</p>
                        </div>}
                        {/* {images?.slice(0, 4).map((eachImage, i) => <div>
                            <img src={`https://xsgames.co/randomusers/assets/avatars/male/${eachImage}.jpg`}
                                alt='' className='roundedImage' style={{zIndex: i+1}} />
                        </div>)}
                        {images.length > 4 && <div className='roundedImage custTag1 bg-gray-600'>
                                <p className='fs-12px text-gray-600 fw-700'>+{images.length - 4}</p>
                        </div>} */}
                    </div>
}

                    <div className='d-flex gap-8px align-items-center'>
                        <div data-tooltip-id="my-tooltip1" data-tooltip-content={`${moment().diff(moment(deal.cts), 'days')} days since deal creation`} className='d-flex gap-4px align-items-center'>
                            <i class="ri-timer-2-line fs-20px lh-20px color-grey-700"></i>
                            <p className='fs-12px fw-700 color-grey-500'>{moment().diff(moment(deal.cts), 'days')}D</p>
                        </div>
                        <Tooltip style={{ backgroundColor: "white", color: "black" }} id="my-tooltip1"  place={"bottom"} />
                       
                        <div data-tooltip-id="my-tooltip1" data-tooltip-content={`${deal?.activities?.filter(activity => activity?.status === "CLOSE")?.length} completed out of ${deal?.activities?.length} activities `} className='d-flex gap-4px align-items-center'>
                            <i class="ri-calendar-check-line fs-20px lh-20px color-grey-600"></i>
                            <p className='fs-12px fw-700 color-grey-500'>{deal?.activities?.filter(activity => activity?.status === "CLOSE")?.length}<span className='color-grey-400'>/{deal?.activities?.length}</span></p>
                        </div>
                    </div>
                </div>
            </div>)}
        </Draggable>
    )
}
