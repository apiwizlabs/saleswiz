import React, {useState} from 'react';
import Calls from './Calls';
import Tasks from './Tasks';

const Activities = ({dealsData}) => {
    const tabs = ["Tasks", "Calls"];
    const [activeSection, setActiveSection] = useState(tabs[0]);


    return (
        <div className='bg-white w-100 h-100 br-6px px-24px py-16px'>
            <div className='h-40px d-flex align-items-center mb-24px'>
                <p className='color-grey-900 fs-16px fw-700'>Activities</p>
            </div>
            <div className='d-flex'>
                {tabs.map(tab => {
                    return (
                        <div onClick={()=>setActiveSection(tab)} className={`px-24px py-8px cursor ${activeSection === tab ? 'active-border-bottom' : ''}`}>
                            <p className={`fs-14px color-grey-700`}>{tab}</p>
                        </div>
                    )
                })}
            </div>
            {activeSection === "Tasks" ?  <Tasks dealsData={dealsData} /> : <Calls dealsData={dealsData} />  }
                
        </div>
    );
};

export default Activities;