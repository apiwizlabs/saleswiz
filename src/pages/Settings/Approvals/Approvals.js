import React, { useState } from 'react';
import History from './History';
import Required from './Required';
import { useOutletContext } from 'react-router-dom';

const Approvals = () => {
    const [activeSection, setActiveSection] = useState("Required");

    return (
        <div >
        <div className='d-flex grey-divider mt-16px'>
            <div onClick={()=>setActiveSection("Required")} className={`px-24px py-8px cursor ${activeSection === 'Required' ? 'active-border-bottom' : ''}`}>
                <p className={`fs-14px color-grey-700`}>Approval Required</p>
            </div>
            <div onClick={()=>setActiveSection("History")} className={`px-24px py-8px cursor ${activeSection === 'History' ? 'active-border-bottom' : ''}`}>
                <p className={`fs-14px color-grey-700`}>History</p>
            </div>
        </div>
        {activeSection === 'Required' ?
            <Required />:
            <History />
        }
      
    </div>
    );
};

export default Approvals;