import React from 'react';
import Select from 'react-select';
import { useState, useEffect } from 'react';
import { ActivityAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import LineDivider from '../../assets/icons/line-divider.svg';
import TimelineDot from "../../assets/icons/timeline-dot.svg";
import moment from 'moment';
import { useParams } from 'react-router-dom';

const ContactTimeline = ({overviewData}) => {
    console.log(overviewData, "OVERIEW DATA");
    const linkedDealsOptions = overviewData?.linkedCustomer?.deals?.map(deal => (
        {label: deal.userValues.find(userValue => userValue.labelName === "Deal Name")?.fieldValue, value: deal._id}
    ))
    const [selectedDeal, setSelectedDeal] = useState(linkedDealsOptions.length > 0 ? linkedDealsOptions[0].value : null);
    const [contactActivities, setContactActivities] = useState(null);
    const [loading, setLoading] = useState(false);
    const {contactId} = useParams()

    const getContactActivities = async () => {
        try {
          setLoading(true)
          const dealActivities = await ActivityAPI.getDealActivities({ dealId: selectedDeal, type: "CALL"});                                   
          const contactActivities = dealActivities?.data?.data;
          const filteredContactActivities = contactActivities.filter(activity =>activity.linkedCallContact._id === contactId)
          // Sort the array by date in ascending order
          filteredContactActivities.sort((a, b) => {
            const dateA = new Date(a.cts);
            const dateB = new Date(b.cts);

            // Compare dates first
            if (dateA > dateB) {
                return 1;
            } else if (dateA < dateB) {
                return -1;
            }

            // If dates are equal, compare milliseconds (time)
            const millisecondsA = dateA.getMilliseconds();
            const millisecondsB = dateB.getMilliseconds();

            return millisecondsA - millisecondsB});
          
          // Group objects with equivalent dates
          const groupedData = {};
          const todaysDate = moment().format("DD/MM/YYYY");
          const yesterdaysDate = moment().subtract(1, 'days').format("DD/MM/YYYY");
          filteredContactActivities.forEach((item) => {
            
            let dateKey = moment(item.cts).format('DD/MM/YYYY');
            if(dateKey === todaysDate){
                dateKey = "Today"
            }else if(dateKey === yesterdaysDate){
                dateKey = "Yesterday"
            }
            console.log(dateKey, "DATE KEY", item.momentDate, item.cts.valueOf());
            if (!groupedData[dateKey]) {
              groupedData[dateKey] = [];
            }
            groupedData[dateKey].push(item);
          });
          setContactActivities(groupedData);
          setLoading(false);
        } catch (err) {
            setLoading(false)
            console.error(err);
            return null; // Handle the error as needed
        }
      };

    useEffect(()=>{
        if(selectedDeal){
            getContactActivities()
        }
    },[selectedDeal])
    
    return (
        <div className='bg-white w-100 h-100 br-6px px-24px py-16px'>
            <div className='w-320px gap-6px d-flex flex-column mb-24px'>
                <p className='color-grey-700 fs-14px'>Select Deal</p>
                <Select 
                isDisabled={linkedDealsOptions.length <= 0}
                options={linkedDealsOptions}
                onChange={(chosenOption)=>{
                    setSelectedDeal(chosenOption.value)
                }}
                components={{
                    IndicatorSeparator: () => null,
                }}
                value={selectedDeal ? {label: linkedDealsOptions.find(option => option.value === selectedDeal).label, value: selectedDeal} : null}
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isDisabled ? 'var(--grey-200)' : 'transparent',
                        borderColor: state.isDisabled ? 'var(--grey-200) !important' : 'hsl(0, 0%, 80%)',
                    }),
                }} />
                <p className='color-grey-600 fs-14px'>Select the deal you want to view the Timeline for. Current contact might be part of several deals</p>
            </div>
           

            <p className='color-grey-900 fs-16px fw-500 mb-30px'>Timeline</p>
        {loading ? <Loader /> : 
         contactActivities && Object.keys(contactActivities).length > 0 ?  
          <div>
            {Object.entries(contactActivities).map(activity => {
                return (
                    <>
                        <div className='timeline-day-badge d-flex-center h-28px'>
                            {activity[0]}
                        </div>
                        {activity[1].map(item => {
                            console.log("each item here" , item);
                            return (
                                <div className='d-flex timeline-item align-items-center gap-32px'>
                                     <p className='color-grey-900 fs-12px'>05:49 AM</p>
                                        <div className='d-flex flex-column'>
                                            <img src={LineDivider} height={"43px"}/>
                                            <img src={TimelineDot} width={"8px"} height={"8px"} />
                                            <img src={LineDivider} height={"43px"}/>
                                        </div>
                                        <div className='d-flex px-19px py-23px align-items-center'>
                                            <i class="ri-phone-line fs-24px lh-24px mr-8px"></i>
                                            <div className='d-flex flex-column'>
                                                <p className='color-grey-900 fs-14px'>Call added with {item.assignedTo?.firstName || "" + " "+ item.assignedTo?.lastName}</p>
                                                <p className='color-grey-600 fs-10px'>{item.callDescription}</p>
                                            </div>
                                        </div>
                                </div>
                            )
                        })}
                    </>
                )
            })}
            {/* <div className='timeline-day-badge d-flex-center w-50px h-28px'>
                Today
            </div>
            <div className='d-flex timeline-item align-items-center gap-32px'>
               
            </div> */}
          </div> : 
        <p className='color-grey-500 fs-14px'>Nothing To See Yet</p>
        }
       

    </div>
    );
};

export default ContactTimeline;