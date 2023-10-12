import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { CurrencyAPI, DealsAPI, LeadsAPI, TemplateAPI, PipelinesAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import { useOutletContext } from 'react-router-dom';
// import Currency from "../Settings/Currency";
import DatePicker from "react-datepicker";
import RadioChecked from "../../assets/icons/RadioChecked.svg";
import RadioUnchecked from "../../assets/icons/RadioUnchecked.svg";
import { Dropdown } from 'react-bootstrap';
import Select, { components } from 'react-select';
import moment from 'moment';
import UncheckedBox from '../../assets/icons/small-unchecked.svg';
import CheckedBox from '../../assets/icons/small-checked.svg';
import { Portal } from 'react-overlays'
import { type } from '@testing-library/user-event/dist/type';
import { ADMIN_ROLES, SALES_OWNER } from '../../utils/constants';
import {toast} from 'react-toastify';
import { phoneData } from '../../utils/countryCodes';
import {emailRegex} from "../../utils/index.js"

const NewDealForm = ({submitDeal, currentPage, setCurrentPage, setSubmitDeal, setOverviewData, handleModalClose, dealId, getPipelineData, handleFilterDeals}) => {

    const [dealFields, setDealFields] = useState(null);
    const [defaultCount, setDefaultCount] = useState(0)
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [loading, setLoading] = useState(false);
    const [dealInput, setDealInput] = useState(dealId ? null : {userValues:[]});
    const [dealErrors, setDealErrors] = useState({});
    const [currencyData, setCurrencyData] = useState(null);
    const [customersData, setCustomersData] = useState(null);
    const [teamMembersData, setTeamMembersData] = useState([]);


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const _dealFields = await TemplateAPI.getTemplateByType("DEAL");
                const currentCurrencyData = await CurrencyAPI.getCurrencies();
                const allCustomers = await  LeadsAPI.getAllCustomers();
                if(dealId){
                    const dealData = await DealsAPI.getDealById(dealId);
                    console.log(dealData, "deal DATA SINGLE");
                    if( dealData?.data?.data?.linkedCustomer ){
                        const customerData = await LeadsAPI.getCustomerById(dealData?.data?.data?.linkedCustomer?._id);
                       
                        setTeamMembersData(customerData?.data?.data?.linkedTeam?.members?.map(member => (
                            {value: member._id, label: member.firstName + " " + member.lastName })))
                    }
                   
                    if(dealData.status === 200){
                        console.log(dealData, "CUST DATA !)!");
                        setDealInput({
                            linkedCustomer: dealData.data.data.linkedCustomer._id, 
                            userValues: dealData.data.data.userValues.map(item => ({labelName: item.labelName, fieldValue: item.fieldValue}))
                        })
                    }
                }

                if(allCustomers.status === 200){
                    // if(ADMIN_ROLES.includes(currentUserData?.userRole)){
                        const formattedCustomers = allCustomers?.data?.data?.map(customer => ({label: customer.userValues.find(item => item.labelName === "Customer Name").fieldValue, value: customer._id}))
                        if(formattedCustomers?.length < 1 ){
                            toast.error("Need Atleast one customer to add a Deal")
                            handleModalClose()
                        }   
                        setCustomersData(formattedCustomers);    
                                      
                    // }else{
                    //     let nestedCustomers = allCustomers?.data?.data.map(teamData =>[ ...teamData.customers]);
                    //     let arr1d = [].concat.apply([], nestedCustomers); //converting from 2d to 1d array
                    //     const formattedCustomers = arr1d.map(customer => ({label: customer.userValues.find(item => item.labelName === "Customer Name").fieldValue, value: customer._id}))
                    //     if(formattedCustomers?.length < 1 ){
                    //         toast.error("Need Atleast one customer to add a Deal")
                    //         handleModalClose()
                    //     }   
                    //     setCustomersData(formattedCustomers); 
                    // }
                }
               
                if(currentCurrencyData.status === 200){
                    setCurrencyData(currentCurrencyData.data.data)
                }
                console.log(_dealFields, "FORM CUSTS");
                if(_dealFields.status === 200){
                    let _data = [...(_dealFields?.data?.data?.formFields || [])]
                    let isDefault = []
                    let isRest = []

                    _data.forEach((each) => {
                        if (each.isDefault){
                            isDefault.push(each)
                        } else {
                            isRest.push(each)
                        }
                    })
                    setDefaultCount(isDefault.length)
                    setDealFields([...isDefault,...isRest]);
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])


    useEffect(()=>{
        if(submitDeal){
            console.log("deal inp end:: ", dealInput);
            const errors = validateUserInputs(dealInput)
            setDealErrors(errors);
            console.log("CHECK HERE ::  ",errors);
            if(Object.keys(errors).length > 0){
                setSubmitDeal(false);
                return;
            }
            try{
                setLoading(true)
                console.log("its successfule :: ",dealInput);
                (async () => {
                    if(dealId){
                        const dealCreated = await DealsAPI.updateDeal(dealId, dealInput);
                        if(dealCreated.status === 200){
                            if(!setOverviewData){
                                if(!currentPage || !setCurrentPage){
                                    getPipelineData()
                                }else{
                                    if(currentPage === 1){
                                        handleFilterDeals()
                                    }else{
                                        setCurrentPage(1)
                                    }
                                }
                                handleModalClose()
                            }else{
                                const dealData = await DealsAPI.getDealById(dealId);
                                if(dealData.status === 200){
                                    setOverviewData(dealData.data.data)
                                    handleModalClose()
                                }
                            }
                        }
                    }else{
                        const dealCreated = await DealsAPI.createDeal(dealInput);
                        console.log(dealCreated.status,"IN THIS AS CREAT DEAL",getPipelineData)

                        if(dealCreated.status === 200){
                            getPipelineData()
                            handleModalClose()
                        }
                    }
                    setSubmitDeal(false);
                    setLoading(false)
                })()
            }catch(err){
                handleModalClose()
                setSubmitDeal(false);
                console.error(err, "::ERROR")      
            }
        }

    },[submitDeal])

    const handleInputChange = async ({value , labelName, field, isDynamic}) => {
        if(isDynamic){

            let dynamicInputs = dealInput.userValues;
            let flag = false;
            for(let i = 0; dynamicInputs.length > i; i++){
                if(dynamicInputs[i].labelName === labelName){
                    flag = true;
                    if(field.fieldType === "Currency"){
                        dynamicInputs[i].fieldValue[1] = value?.currency;
                        dynamicInputs[i].fieldValue[0] = value?.number;
                        dynamicInputs[i].type = field.fieldType;
                    }
                    else if(field.fieldType === "Phone"){
                        dynamicInputs[i].fieldValue[1] = value?.country;
                        dynamicInputs[i].fieldValue[0] = value?.phone;
                        dynamicInputs[i].type = field.fieldType;
                    }
                    else{
                        dynamicInputs[i].fieldValue = value;
                        dynamicInputs[i].type = field.fieldType;
                    }                    
                }
               
            }
            if(!flag){
                if(field.fieldType === "Currency"){
                    if(value?.currency){ 
                        dynamicInputs.push({fieldValue: ["", value?.currency], type:field.fieldType , labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                    else if(value?.number){
                        dynamicInputs.push({fieldValue: [value?.number, ""], type:field.fieldType, labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                }
                else if(field.fieldType === "Phone"){
                    if(value?.country){ 
                        dynamicInputs.push({fieldValue: ["", value?.country], type:field.fieldType , labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                    else if(value?.phone){
                        dynamicInputs.push({fieldValue: [value?.phone, ""], type:field.fieldType, labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                }else{
                    dynamicInputs.push({fieldValue: value, labelName: labelName, type:field.fieldType , templateFieldId: field._id, isMandatory: field.isMandatory})
                }
            }
          
            setDealInput(prev => ({...prev, userValues: dynamicInputs}));
            return;
        }
        if(labelName === "linkedCustomer"){
            console.log(value, "Customer Value");
            try{
                const customerData = await LeadsAPI.getCustomerById(value);
                console.log(customerData, "Customer DATA SINGLE");
                setTeamMembersData(customerData?.data?.data?.linkedTeam?.members?.map(member => ({value: member._id, label: member.firstName + " " + member.lastName })))

            }catch(err){
                console.log(err)
            }
            
        }
        setDealInput(prev => ({...prev, [labelName]: value}));
    }

    useEffect(()=>{console.log("CHANGED INP ::", dealInput)},[dealInput])


    const fieldTypeReturn = (fieldType, field) => {
        const _id = field.labelName.split(" ").join();

        switch(fieldType){
            case "Text Field":
                {console.log( "FIELD DATA ::",field.labelName , field?.templateFieldId)}
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={dealInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='text'/>
                            {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                    {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                </div>
            )

            case "Email":
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={dealInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='email'/>
                            {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                    {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                </div>
            )

            case "Currency":
                return(
                    <CurrencyInput _id={_id} field={field} currencyData={currencyData} dealErrors={dealErrors} handleInputChange={handleInputChange} dealInput={dealInput} dealId={dealId} />
                )

            case "Number":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <input 
                        className={`h-40px py-8px px-12px br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : '' }`} 
                        id={_id}
                        onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                        value={dealInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                        onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                        placeholder={`Type the ${field.labelName}`}
                        min="0"
                        type='number'/>
                                        {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}

                        {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Text Area":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <textarea style={{resize:"vertical"}} className={`ta py-8px px-12px br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : '' }`} 
                            id={_id}
                            value={dealInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                            onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                            placeholder={`Type the ${field.labelName}`}
                        >
                            
                        </textarea> 
                        {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}

                        {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Dropdown":
                return (
                    <div key={field._id}>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <Select 
                            placeholder={`Select the ${field.labelName}`}
                            onChange={(chosenOption)=>{
                                handleInputChange({value: chosenOption.value, labelName: field.labelName, field: field, isDynamic: true })
                            }}
                            options={field.valueOptions.map(item => ({value: item, label: item}))}
                            components={{
                                IndicatorSeparator: () => null,
                            }}
                            value={dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? 
                            {label: dealInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "", 
                            value: dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: dealErrors[field.labelName] ? 'var(--error-50)' : state.isDisabled? 'var(--grey-100)' : 'transparent',
                                    borderColor: dealErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                            }}
                        />
                                        {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}

                        {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Date Picker":
                return ( <DatePickerGroup _id={_id} field={field} handleInputChange={handleInputChange} dealErrors={dealErrors} dealId={dealId} dealInput={dealInput} /> )
                
            case "Radio":
                return (
                    <RadioInput field={field} handleInputChange={handleInputChange} dealInput={dealInput} dealId={dealId} dealErrors={dealErrors} />
                )

            case "Checkbox":
                return (
                    <CheckboxInput field={field} handleInputChange={handleInputChange} dealInput={dealInput} dealId={dealId} dealErrors={dealErrors} />
                )

            case "Phone":
                return (
                    <PhoneInput _id={_id} field={field} currencyData={currencyData} dealErrors={dealErrors} handleInputChange={handleInputChange} dealInput={dealInput} dealId={dealId}  />
                )
       
            case "Users":
            return (
                <div key={field._id}>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <Select 
                        isDisabled={!dealInput?.linkedCustomer || !teamMembersData}
                        placeholder={`Select the ${field.labelName}`}
                        onChange={(chosenOption)=>{
                            handleInputChange({value: chosenOption.value, labelName: field.labelName, field: field, isDynamic: true })
                        }}
                        options={teamMembersData}
                        components={{
                            IndicatorSeparator: () => null,
                        }}
                        value={dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? {
                            label: teamMembersData?.find(member => member.value === dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue)?.label || "", 
                            value: dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                backgroundColor: dealErrors[field.labelName] ? 'var(--error-50)' : state.isDisabled ? 'var(--grey-100)': 'transparent',
                                borderColor: dealErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                            }),
                            menu: (baseStyles, state) => ({
                                ...baseStyles, 
                                zIndex: 2
                            })
                        }}
                    />
                    {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'>
                        <i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                    {dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
                </div>
            )

            default:
                return (  
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <input  className={`h-40px py-8px px-12px br-6px input-styles`} 
                            id={_id}
                            onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                            placeholder={`Type the ${field.labelName}`}
                            type='text'
                        />
                         {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}

                    </div>
                )
        }
    }



    const validateUserInputs = (userInputs) => {
        let errors = {};
    
        // Get required label names
        const requiredFields = dealFields
            .filter((curr) => curr.isMandatory && (!curr.isSensitive || curr.writeAccessRoles.includes(currentUserData.userRole)))
            
        const requiredLabelNames = requiredFields.map((curr) => curr.labelName);
    
        // Validate userValues
        for (let item of userInputs.userValues) {
            if(item.type === "Email" && item.fieldValue && !emailRegex.test(item.fieldValue)){
                errors[item.labelName] = "Enter a valid Email"
            }
            if (item.isMandatory && requiredLabelNames.includes(item.labelName)) {
                if (item.type === "Currency" || item.type === "Phone" ) {
                    if (!item.fieldValue || !item.fieldValue[0] || !item.fieldValue[1]) {
                        errors[item.labelName] = `${item.labelName} is a required field`;
                    }
                } 
                
                else if (item.type === "Checkbox") {
                    if (!item.fieldValue || item.fieldValue.length === 0) {
                        errors[item.labelName] = `${item.labelName} is a required field`;
                    }
                } else {
                    if (!item.fieldValue) {
                        errors[item.labelName] = `${item.labelName} is a required field`;
                    }
                }
            }
        }
        console.log(userInputs.userValues, "LINE 258");
        console.log(requiredFields, "LINE 259");
    
        // Check for remaining required fields
        for (let requiredField of requiredFields) {
            const item = requiredField.labelName
            let flag = false;
            for(let input of userInputs.userValues){
                if(input.labelName === item){
                    flag = true;
                }
                if( input.labelName === item && requiredField.fieldType === "Checkbox"){
                    if ((!input.fieldValue || input.fieldValue.length === 0) && !errors[item]) {
                        errors[item] = `${input.labelName} is a required field`;
                    }
                }else if ( input.labelName === item && requiredField.fieldType === "Currency"){
                    if ((!input?.fieldValue || input?.fieldValue.length < 2 ||  !input?.fieldValue[0] || !input?.fieldValue[1]) && !errors[item]) {
                        errors[item] = `${input.labelName} is a required field`;
                    }
                }
                else if ( input.labelName === item && requiredField.fieldType === "Phone"){
                    if ((!input?.fieldValue || input?.fieldValue.length < 2 ||  !input?.fieldValue[0] || !input?.fieldValue[1]) && !errors[item]) {
                        errors[item] = `${input.labelName} is a required field`;
                    }
                }
                else if(input.labelName === item && !input.fieldValue && !errors[item]){
                    errors[item] = `${item} is a Required field`;
                }
            }
            if(!flag){
                errors[item] = `${item} is a Required field`;
            }
        }
        if(!userInputs.linkedCustomer){
            errors.linkedCustomer = "Related Customer is a required field."
        }
    
        return errors;
    };
    
    

    return (
        <div id="calendar-portal" className='p-16px h-max-content mt-16px'>
            {loading ? <Loader /> : 
            (!dealId && dealFields?.length > 0) || (dealId && dealFields?.length > 0 && dealInput) ? 
            <div className=''> 
                               
               <div className='d-flex flex-column '>
                    <label className='fw-500 mb-6px' htmlFor="linkedCustomer">Linked Customer</label>
                    {customersData?.length > 0 ? <Select 
                        components={{
                            IndicatorSeparator: () => null,
                        }}
                        placeholder={`Select the Customer`}
                        isDisabled={dealId}
                        defaultValue={!dealId ? null :
                            {value: dealInput?.linkedCustomer, label: customersData.find(customer => customer.value === dealInput.linkedCustomer)?.label}}
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                backgroundColor: dealErrors.linkedCustomer ? 'var(--error-50)' : 'transparent',
                                borderColor: dealErrors.linkedCustomer ? 'var(--error-500)' : 'hsl(0, 0%, 80%)',
                            }),
                        }}
                        onChange={(chosenOption) => {
                            handleInputChange({
                                value: chosenOption.value,
                                labelName: "linkedCustomer",
                            });
                        }}
                        options={customersData} 
                    /> : <p>No Customers Yet</p>}

                    {dealErrors.linkedCustomer && <p className='error-txt'>{dealErrors.linkedCustomer}</p>}
                </div>
                 {dealFields.map((field, i) => {
                    if(!field.isTechnicalInfo){
                        if(!field.isSensitive || ADMIN_ROLES.includes(currentUserData?.userRole) || field.isSensitive && field.writeAccessRoles.includes(currentUserData?.userRole)){
                            if (i !== defaultCount) {
                                return fieldTypeReturn(field.fieldType, field)
                            } else {
                                return <>
                                    <p className='mt-5 fw-bold mb-0'>Additional Details:</p>
                                    {fieldTypeReturn(field.fieldType, field)}
                                </>
                            }
                        }
                    }
                    return null
                    
                })}
             </div>
            : <p>No Fields Yet</p>}
        </div>
    );
};

const RadioInput = ({ field, handleInputChange, dealErrors, _id, dealId, dealInput }) => {
    const radioState = dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "";

    const handleRadioChange = (optionValue) => {
        handleInputChange({ value: optionValue, labelName: field.labelName, field: field, isDynamic: true });
    };

    return (
        <div className='d-flex flex-column'>
            <label className='fw-500 mt-16px' htmlFor={_id}>{field.labelName}</label>
            {field.valueOptions.map(optionValue => {
                return (
                    <div className='d-flex gap-8px mt-12px' key={optionValue}>
                        <img
                            className='cursor'
                            onClick={() => handleRadioChange(optionValue)}
                            src={optionValue === radioState ? RadioChecked : RadioUnchecked}
                        />
                        <p
                            onClick={() => handleRadioChange(optionValue)}
                            className='color-grey-900 fs-16px cursor'>
                            {optionValue}
                        </p>
                    </div>
                )
            })}
                {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
            {dealErrors[field.labelName] && <p className='error-txt'>You have not selected an option</p>}
        </div>
    )
}



const CheckboxInput = ({ field, handleInputChange, dealErrors, _id, dealId, dealInput }) => {
    const checkboxState = dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || [];
    console.log(checkboxState, "123 UPD CHECKBOX STATE");


    const toggleCheckbox = (optionValue) => {
        let updatedState;

        if (checkboxState.includes(optionValue)) {
            // If the optionValue is already in the state, remove it
            updatedState = checkboxState.filter((value) => value !== optionValue);
        } else {
            // If the optionValue is not in the state, add it
            updatedState = [...checkboxState, optionValue];
        }

        // Update the state for this checkbox
        console.log(updatedState, "UPD CHECKBOX STATE");
        handleInputChange({
            value: updatedState,
            labelName: field.labelName,
            field: field,
            isDynamic: true
        });
    };

    return (
        <div className='d-flex flex-column'>
            <label className='fw-500 mt-16px' htmlFor={_id}>{field.labelName}</label>
            {field.valueOptions.map((optionValue) => (
                <div className='d-flex gap-8px mt-12px' key={optionValue}>
                    <img
                        className='cursor'
                        onClick={() => toggleCheckbox(optionValue)}
                        src={checkboxState.includes(optionValue) ? CheckedBox : UncheckedBox}
                    />
                    <p
                        onClick={() => toggleCheckbox(optionValue)}
                        className='color-grey-900 fs-16px cursor'>
                        {optionValue}
                    </p>
                </div>
            ))}
             {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
            {dealErrors[field.labelName] && <p className='error-txt'>You have not selected any options</p>}

        </div>
    );
};


const PhoneInput = ({ field, _id, dealErrors, handleInputChange, dealInput, dealId }) => {
    const [chosenCountry, setChosenCountry] = useState(!dealId ? phoneData[0].value :  ( dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1] || phoneData[0]?.value))
    const [phoneInput, setPhoneInput] = useState(!dealId ? "" : (dealInput?.userValues?.find(item => item.labelName === field.labelName)?.fieldValue[0] || 0));
    const phoneCodeNumber = phoneData.find(item => item.value === chosenCountry)?.phoneCode


    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div className='d-flex align-items-center gap-8px'>
            <div className='position-relative'>
                    <p style={{top: "8px", left: "10px"}} className='position-absolute zIndex-1'>{chosenCountry}</p>
                  
                    <Select
                        components={{
                            IndicatorSeparator: () => null,
                        }}
                        isSearchable={false}
                        value={phoneData.find(item => item.value === chosenCountry)}
                        defaultValue={phoneData[0]}
                        onChange={(chosenOption) => {
                            console.log(chosenOption, "CHOSEN OPT")
                            setChosenCountry(chosenOption.value);
                            handleInputChange({
                                value: { country: chosenOption.value, phone: phoneInput },
                                labelName: field.labelName,
                                field: field,
                                isDynamic: true
                            });
                        }}
                        styles={{
                            valueContainer: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            clearIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            singleValue: (baseStyles) => ({ ...baseStyles, width: "50px",  color: "white" }),
                            control: provided => ({
                                ...provided,
                                color: 'white',
                                width: '65px'
                            }),
                            menu: (base) => ({
                                ...base,
                                width: "max-content",
                                minWidth: "100%"
                        }),
                            
                        }}
                        options={phoneData}
                    />
                  </div>
                  <div className="position-relative w-100">
                    <p style={{left: "12px", top: '8px'}} className="position-absolute color-grey-500">{'+' + phoneData.find(item => item.value === chosenCountry)?.phoneCode}</p>
                    <input
                        className={`h-40px w-100 py-8px pr-12px ${ phoneCodeNumber?.length > 3 ? 'pl-75px' : phoneCodeNumber?.length > 2 ? 'pl-60px' : 'pl-50px'} br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : ''}`}
                        id={_id}
                        onKeyDown={(evt) => ["e", "E"].includes(evt.key) && evt.preventDefault()}
                        value={phoneInput}
                        onChange={(e) => {
                            const inputValue = e.target.value.trim(); // Remove leading/trailing spaces
                            setPhoneInput(inputValue);
                            handleInputChange({
                                value: { phone: inputValue, country: chosenCountry },
                                labelName: field.labelName,
                                field: field,
                                isDynamic: true
                            });
                        }}
                        placeholder={`Type the ${field.labelName}`}
                        min="0"
                        type='number' />
                  </div>

                
            </div>
            {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}        
            {dealErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
            </div>
    );
};
const CurrencyInput = ({ field, currencyData, _id, dealErrors, handleInputChange, dealInput, dealId }) => {
    const optionsData = currencyData.map((currency) => ({ label: currency.currencyValue, value: currency.currencyValue }));
    const [chosenCurrency, setChosenCurrency] = useState(!dealId ? optionsData[0].value :  (dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1] || optionsData[0]?.value))
    const [numberInput, setNumberInput] = useState(!dealId ? "" : (dealInput?.userValues?.find(item => item.labelName === field.labelName)?.fieldValue[0] || 0));

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div className='d-flex position-relative'>
                <input
                    className={`h-40px w-100 py-8px pr-90px px-12px br-6px input-styles ${dealErrors[field.labelName] ? 'error-input' : ''}`}
                    id={_id}
                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                    value={numberInput}
                    onChange={(e) => {
                        const inputValue = e.target.value.trim(); // Remove leading/trailing spaces
                        setNumberInput(inputValue);
                        handleInputChange({
                            value: { number: inputValue, currency: chosenCurrency },
                            labelName: field.labelName,
                            field: field,
                            isDynamic: true
                        });
                    }}
                    placeholder={`Type the ${field.labelName}`}
                    min="0"
                    type='number' />
                <div style={{right: "5px", top: "1px"}} className='position-absolute'>
                    <Select
                        components={{
                            IndicatorSeparator: () => null
                        }}
                        value={optionsData.find(item => item.value === chosenCurrency)}
                        defaultValue={optionsData[0]}
                        onChange={(chosenOption) => {
                            setChosenCurrency(chosenOption.value);
                            handleInputChange({
                                value: { currency: chosenOption.value, number: numberInput },
                                labelName: field.labelName,
                                field: field,
                                isDynamic: true
                            });
                        }}
                        styles={{
                            valueContainer: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            clearIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            singleValue: (baseStyles) => ({ ...baseStyles, width: "50px" }),
                            dropdownIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            control:(baseStyles, state) => ({ ...baseStyles, border: state.isFocused ? "none" : "none", boxShadow: state.isFocused ? 0 : 0, }),
                            menu: (baseStyles) => ({
                                ...baseStyles,
                                position: "absolute",
                                minWidth: "100px",
                                right: 0,
                                zIndex: 100
                            }),
                        }}
                        options={optionsData}
                    />
                </div>

            </div>
            {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}        
            {dealErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
            </div>
    );
};


const CustomCalendarInput = forwardRef((props, ref) => {
    console.log(props.dealErrors, "DATE PROPS");
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "40px", borderRadius: "6px", backgroundColor: props.dealErrors[props.field.labelName] ? "var(--error-50)" : "transparent", border: props.dealErrors[props.field.labelName] ? "1px solid var(--error-500)" : "1px solid var(--gray-300, #D0D5DD)" }} {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "8px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} className="ri-calendar-event-line"></i>
        </div>
    );
  });
  

const DatePickerGroup = ({field, _id, handleInputChange, dealErrors, dealInput, dealId}) => {
    const [startDate, setStartDate] = useState( !dealId ? null: moment(dealInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue, 'DD/MM/YYYY').toDate());
    const inputRef = useRef(null);

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div>
                <DatePicker
                    customInput={ <CustomCalendarInput dealErrors={dealErrors} field={field} inputRef={inputRef}/>}
                    dateFormat="dd/MM/yyyy"
                    selected={startDate}
                    onChange={(date)=>{
                        console.log(date, "PICKER DATE");
                        setStartDate(date)
                        handleInputChange({value: moment(date).format('DD/MM/YYYY'), 
                        labelName: field.labelName, field: field, isDynamic: true })
                    }} 
                />
                {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'><i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                { dealErrors[field.labelName] && <p className='error-txt'>{dealErrors[field.labelName]}</p>}
            </div>
        </div>
    )
}



export default NewDealForm;