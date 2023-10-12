import React, {useState, useEffect} from 'react';
import SideModal from '../../components/Modals/SideModal';
import Select from 'react-select';
import {currencyData} from '../../currency';
import {CurrencyAPI} from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import { useOutletContext } from 'react-router-dom';
import { ADMIN_ROLES, TEAM_LEADS } from '../../utils/constants';

const Currency = () => {

    const [addCurrencyModal, setAddCurrencyModal ] = useState(false);
    const [currencyAPIData, setCurrencyAPIData] = useState(null)
    const [submitClick, setSubmitClick] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [selectedCurrencyError, setSelectedCurrencyError] = useState(false);
    const [currentUserData, _] = useOutletContext();

    useEffect(()=>{

        (async ()=>{
            try{
                setLoading(true);
                const currencyData = await CurrencyAPI.getCurrencies()
                if(currencyData.status === 200){
                    setCurrencyAPIData(currencyData.data.data);
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()

    },[])

    useEffect(()=>{
        if(submitClick){
            if(!selectedCurrency){
                setSelectedCurrencyError(true);
                setSubmitClick(false)
                return;
            }
            (async ()=>{
                try{
                    setLoading(true);
                    const createdCurrency = await CurrencyAPI.createCurrency({currencyValue : selectedCurrency.value, currencyLabel: selectedCurrency.label})
                    if(createdCurrency.status === 200){
                        const allTeamsData = await CurrencyAPI.getCurrencies()
                        setCurrencyAPIData(allTeamsData.data.data);                       
                    }
                    setSubmitClick(false)
                    setAddCurrencyModal(false)
                    setLoading(false);
                }catch(err){
                    setLoading(false)
                    setSubmitClick(false)
                    console.error(err)
                }
            })()
            
           
        }

    },[submitClick])

    return (

        <div className='w-462px m-auto h-max-content br-6px p-24px d-flex flex-column border-grey-300 mt-67px'>
            <p className='color-grey-700 fs-14px fw-500 '>All Currencies</p>
            <p className='color-grey-500 fs-14px mb-16px'>User can add different currencies to their deals. User would be able to select and change currencies while creating a deal</p>

            <div className='d-flex flex-column gap-12px'>
                {loading ? <Loader /> : currencyAPIData && currencyAPIData?.length > 0 ?
                 currencyAPIData.map(currency =>{
                    return (
                        <CurrencyCard setLoading={setLoading} props={currency} setCurrencyAPIData={setCurrencyAPIData} />
                    )
                }) : <p>Nothing To See Yet</p>}
            </div>

            {[...ADMIN_ROLES, ...TEAM_LEADS].includes(currentUserData?.userRole) && 
            <button onClick={()=>setAddCurrencyModal(true)} className='secondary-btn w-100 x-16px py-10px d-flex-center gap-5px mt-16px'>
                <i className="ri-add-line fs-20px lh-20px"></i> <p className=' fw-700 fs-14px color-grey-700'>Add Currency</p>
            </button>}

            {addCurrencyModal && 
            <SideModal 
            modalType={"NEW"}
            onClose={()=>setAddCurrencyModal(false)} 
            onSubmit={()=>setSubmitClick(true)} 
            heading={"Add new currency"} 
            children={ 
            <div className='px-20px py-16px'>
                <label className='fw-500 mb-6px mt-16px fs-14px' htmlFor='last-name'>Choose Currency</label>
                <Select
                    name="currency"
                    components={{ 
                        IndicatorSeparator: () => null
                    }}
                    isSearchable={true}
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: selectedCurrencyError ? 'var(--error-50)' : 'transparent',
                            borderColor: selectedCurrencyError ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                        }),
                    }}
                    onChange={(chosenOption)=> {
                        setSelectedCurrency(chosenOption)
                    }}
                    options={currencyData.filter(currency => currencyAPIData?.length > 0 ? !currencyAPIData?.map(data => data.currencyValue).includes(currency.value) : currencyData)}
                    classNamePrefix="select"
                />  
        </div>} />}
        </div>
            
    );
};


const CurrencyCard = ({props, setLoading, setCurrencyAPIData}) => {
    const [activeItem, setActiveItem] = useState(false);
    const [currentUserData, setCurrentUserData ] = useOutletContext()

    const handleDelete = async (currencyId) => {
        try{
            const deletedCurrency = await CurrencyAPI.deleteCurrency(currencyId);
            if(deletedCurrency.status === 200){
                const allTeamsData = await CurrencyAPI.getCurrencies()
                console.log(allTeamsData, "ALL CUFRR DATA");
                setCurrencyAPIData(allTeamsData.data.data);                       
            }
            setLoading(false);
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    return (
    <div onMouseEnter={()=>setActiveItem(true)}
            onMouseLeave={()=>setActiveItem(false)}
            className='br-6px d-flex field-list-item justify-content-between align-items-center h-40px'>
        <p className='color-grey-900 fs-16px '>{props?.currencyLabel}</p>
       {activeItem && ADMIN_ROLES.includes(currentUserData?.userRole) &&
        <div onClick={()=>{handleDelete(props?._id)}}  className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
        <i className="ri-delete-bin-5-line "></i>
        </div>}
    </div>)
}

export default Currency;