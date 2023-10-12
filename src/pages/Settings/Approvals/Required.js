import React, {useEffect, useState} from 'react';
import { ApprovalsAPI } from '../../../api/apiConfig';
import { Loader } from '../../../components/Loader';

const Required = () => {

  const [allApprovals, setAllAPprovals] = useState(null);
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async ()=>{
        try{
            setLoading(true);
            const allApprovals = await ApprovalsAPI.getAllApprovals();
            console.log("MEOW123 APP", allApprovals)

            if(allApprovals.status === 200){
                setAllAPprovals(allApprovals?.data?.data?.filter(item => item.status === "PENDING"));
            }
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    })()
},[])

const handleApprovalStatus = async (id, status) =>{
  try{
    setLoading(true)
    const updatedApproval = await ApprovalsAPI.updateApproval({approvalId: id, status});
    if(updatedApproval.status === 200){
      const allApprovals = await ApprovalsAPI.getAllApprovals();
      if(allApprovals.status === 200){
        setAllAPprovals(allApprovals?.data?.data?.filter(item => item.status === "PENDING"));
      }
    }
    setLoading(false)
  }catch(err){
    console.error(err);
    setLoading(false)
  }
}

      
    return (
        <div className='py-17px px-16px w-100 h-100'>
          {loading ? <Loader /> : 
             allApprovals?.length > 0 ?
              <table className=''>
                    <tr>
                        <th>Field Name</th>
                        <th>Deal Name</th>
                        <th>Name of Requestor</th>
                        <th>Field Value</th>
                        <th>Actions</th>
                    </tr>
                    { allApprovals.map(approval => {
                        return (
                            <tr>
                                <td>{approval?.linkedFieldId?.labelName}</td>
                                <td>{approval?.entityName || ""}</td>
                                <td>{approval?.requestor?.firstName || ""}</td>
                                <td>{ typeof approval?.fieldValue === "object" ? approval?.fieldValue.join(" ") : approval?.fieldValue || 0}</td>
                                <td className='d-flex-center'>
                                    <button onClick={()=>handleApprovalStatus(approval._id, "APPROVED")} className='br-6px fw-600 h-36px w-100px d-flex-center success-bg indicator-btn mr-14px'>
                                      <i className="ri-check-line fs-20px lh-20px "></i> Approve</button>
                                    <button onClick={()=>handleApprovalStatus(approval._id, "REJECTED")} className='br-6px fw-600 h-36px w-77px d-flex-center error-bg indicator-btn'> 
                                    <i className="ri-close-line fs-20px lh-20px"></i> Deny</button>
                                </td>
                            </tr>
                        )
                    })}
                </table>
                : <p>No Approvals To See Yet</p>
          }
        </div>
    );
};

export default Required;