import React, {useEffect, useState} from 'react';
import { ApprovalsAPI } from '../../../api/apiConfig';
import { Loader } from '../../../components/Loader';
import { capitalizeFirstLetters } from '../../../utils';

const History = () => {

  const [allApprovals, setAllAPprovals] = useState(null);
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async ()=>{
        try{
            setLoading(true);
            const allApprovals = await ApprovalsAPI.getAllApprovals();
            console.log("MEOW123 APP", allApprovals)

            if(allApprovals.status === 200){
                setAllAPprovals(allApprovals?.data?.data?.filter(item => item.status !== "PENDING"));
            }
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    })()
},[])

    return (
        <div className='py-17px px-16px w-100 h-100'>
          {loading ? <Loader /> : allApprovals?.length > 0 ? 
          
          <table className=''>
          <tr>
              <th>Field Name</th>
              <th>Deal Name</th>
              <th>Name of Requestor</th>
              <th>Field Value</th>
              <th>Status</th>
          </tr>
          {allApprovals.map(approval => {
              return (
                  <tr>
                      <td>{approval?.linkedFieldId?.labelName}</td>
                      <td>{approval?.entityName || 0}</td>
                      <td>{approval?.requestor?.firstName || 0}</td>
                      <td>{approval?.fieldValue || 0}</td>
                      <td className=''>
                          <p className={`fs-14px fw-600 ${approval.status === "APPROVED" ? "color-success-700" : approval.status === "REJECTED" ? "color-warning-700" : "black" }`}>
                            {capitalizeFirstLetters(approval.status)}
                          </p>
                      </td>
                  </tr>
              )
          })}
      </table>
          : <p> No Approval History Yet</p>}
          
            
        </div>
    );
};

export default History;