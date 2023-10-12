import React, {useState} from 'react';
import { capitalizeFirstLetters } from '../../../utils';

const Overview = ({dealsData, allUsersData}) => {
    return (
        <div className='bg-white w-100 h-100 br-6px px-24px py-16px d-flex gap-20px overflow-y-scroll'>
        <div className='w-307px'>
            <p className='color-grey-900 fs-16px fw-700 '>Overview</p>
            <div className='mt-4px info-card'>
                    {dealsData?.userValues?.map(userValue => {
                        if(userValue?.labelName === "Deal Name"){
                            return null
                        }
                        if(userValue?.templateFieldId?.fieldType === "Currency" && (!userValue?.fieldValue[0] || !userValue?.fieldValue[1])){
                            return null
                        }
                        return (
                        <div className='mt-8px'><p className='color-grey-500 fs-12px'>{userValue?.labelName}</p>
                        {allUsersData && 
                        <p className='color-grey-900 fs-14px fw-500'>
                            {userValue?.templateFieldId?.fieldType === "Users" ? 
                                allUsersData?.find(item => item.id == userValue?.fieldValue)?.name : 
                                typeof userValue?.fieldValue === "object" && 
                                (userValue?.templateFieldId?.fieldType === "Phone" || userValue?.templateFieldId?.fieldType === "Currency" ) ? 
                                userValue?.fieldValue[0] : 
                                typeof userValue?.fieldValue === "object" ? 
                                userValue?.fieldValue?.join(" ,") : 
                                userValue?.fieldValue
                            }
                        </p>}
                        </div>)
                    })}
            </div>
        </div>
        <div className='w-307px d-flex flex-column gap-20px'>
           {dealsData?.linkedCustomer?.contacts?.length > 0 && <div>
                <p className='color-grey-900 fs-16px fw-700 '>Related Contact</p>
                <div className='mt-11px info-card'>
                    {dealsData?.linkedCustomer?.contacts?.map(contact => {
                            return (<ContactCard contact={contact} />)
                        })}
                </div>
            </div>}
            <div>
                <p className='color-grey-900 fs-16px fw-700 '>Related Customer</p>
                <div className='mt-4px info-card'>
                    {console.log("CWAZY :: ", dealsData?.linkedCustomer?.userValues)}
                    {dealsData?.linkedCustomer?.userValues?.splice(0, 3).map(userValue => {
                        return (
                            <div className='mt-8px'>
                                <p className='color-grey-500 fs-12px'>{userValue?.labelName}</p>
                                <p className='color-grey-900 fs-14px fw-500'>{userValue?.fieldValue}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
       
        </div>
        <div className='w-max'>
            <p className='color-grey-900 fs-16px fw-700 '>Team Members</p>
            <div className='mt-11px info-card d-flex flex-column gap-8px'>
                {dealsData?.linkedCustomer?.linkedTeam?.members?.map(member => (
                    <div className='d-flex justify-content-between align-items-center p-4px'>
                        <div className='d-flex align-items-center'>
                            {member?.profileicture?.url ? <img src={member?.profileicture?.url} width="24px" height="24px" className='roundedImage mr-32px' /> : 
                            <div className='name-pic roundedImage d-flex-center color-grey-600 mr-32px fs-12px w-24px h-24px fw-700'>
                                {member?.firstName[0]?.toUpperCase()}
                            </div>  }
                            <p className='color-grey-900 fw-500 fs-14px mr-32px'>{member?.firstName + " " + member?.lastName}</p>
                        </div>
                        <p className='color-grey-600 fs-10px'>{capitalizeFirstLetters(member.role.split('_').join(" "))}</p>

                    </div>
                ))}
                
            </div>
        </div>
    </div>
    );
};

const ContactCard = ({contact}) => {
    console.log(contact, "CONTATC");
    const [toggleContact, setToggleContact] = useState(false)
    const contactName = contact?.userValues?.find(userValue => userValue?.labelName === "Contact Name")?.fieldValue;

return (
    
    <div>
        <div onClick={()=>setToggleContact(prev => !prev)} className='d-flex cursor justify-content-between align-items-center p-4px br-2px' style={{background: 'var(--grey-100)'}}>
            <p className='color-grey-900 fw-500 fs-14px'>{contactName}</p>
            {contact?.userValues?.length > 1 ? !toggleContact ? <i class="ri-arrow-down-s-line fs-20px lh-20px"></i> : <i class="ri-arrow-up-s-line fs-20px lh-20px"></i> : null}
        </div>
        {
            toggleContact && 
            <div className='mb-8px' style={{background: 'var(--grey-50)'}}>
                {contact?.userValues?.slice(0,3).map(userValue => {
                    if(userValue?.labelName === "Contact Name"){
                        return null
                    }
                    return (
                        <div className='p-4px pt-8px '>
                            <p className='color-grey-500 fs-12px lh-20px'>{userValue?.labelName}</p>
                            <p className='color-grey-900 fs-14px fw-500 mt-7px'>{userValue?.fieldValue}</p>
                        </div>
                    )
                })}
            </div>
        }
        {/* <p className='color-grey-900 fs-14px fw-500'>{userValue.fieldValue}</p> */}
    </div>
)
}

export default Overview;