import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { CurrencyAPI, ContactsAPI, TeamAPI, TemplateAPI, LeadsAPI } from '../../api/apiConfig';
import { Loader } from '../../components/Loader';
import { useOutletContext } from 'react-router-dom';
// import Currency from "../Settings/Currency";
import DatePicker from "react-datepicker";
import RadioChecked from "../../assets/icons/RadioChecked.svg";
import RadioUnchecked from "../../assets/icons/RadioUnchecked.svg";
import { Dropdown } from 'react-bootstrap';
import Select from 'react-select';
import moment from 'moment';
import UncheckedBox from '../../assets/icons/small-unchecked.svg';
import CheckedBox from '../../assets/icons/small-checked.svg';
import { Portal } from 'react-overlays'
import { type } from '@testing-library/user-event/dist/type';
import { ADMIN_ROLES } from '../../utils/constants';
import {toast} from 'react-toastify'
import { extractContacts, emailRegex } from '../../utils';
import { phoneData } from '../../utils/countryCodes';
import { PageSize } from '../../utils/constants';

const NewContactForm = ({submitContact, setSubmitContact, setOverviewData, setContactsData, handleModalClose, contactId, currentPage, setCurrentPage, handleFilterContacts}) => {

    const [contactFields, setContactFields] = useState(null);
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [loading, setLoading] = useState(false);
    const [contactInput, setContactInput] = useState(contactId ? null : {userValues:[]});
    const [contactErrors, setContactErrors] = useState({});
    const [currencyData, setCurrencyData] = useState(null);
    const [teamsData, setTeamsData] = useState(null)
    const [customersData, setCustomersData] = useState(null);
    const [defaultCount, setDefaultCount] = useState(0);
    const [teamMembersData, setTeamMembersData ] = useState([])

    const handleInputChange = async ({value , labelName, field, isDynamic}) => {

        if(isDynamic){

            let dynamicInputs = contactInput.userValues;
            let flag = false;
            for(let i = 0; dynamicInputs.length > i; i++){
                if(dynamicInputs[i].labelName === labelName){
                    flag = true;
                    if(field.fieldType === "Currency"){
                        dynamicInputs[i].fieldValue[1] = value?.currency;
                        dynamicInputs[i].fieldValue[0] = value?.number;
                        dynamicInputs[i].type = field.fieldType;
                    } else if(field.fieldType === "Phone"){
                        dynamicInputs[i].fieldValue[1] = value?.country;
                        dynamicInputs[i].fieldValue[0] = value?.phone;
                        dynamicInputs[i].type = field.fieldType;
                    }else{
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
                } else if(field.fieldType === "Phone"){
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
            setContactInput(prev => ({...prev, userValues: dynamicInputs}));
            return;
        }
        console.log(value, "Customer Value");
        if(labelName === "linkedCustomer"){
            
            try{
                const customerData = await LeadsAPI.getCustomerById(value);
                console.log(customerData, "Customer DATA SINGLE");
                setTeamMembersData(customerData?.data?.data?.linkedTeam?.members?.map(member => ({
                    value: member._id, 
                    label: member.firstName + " " + member.lastName })))

            }catch(err){
                console.log(err)
            }
            
        }
        setContactInput(prev => ({...prev, [labelName]: value}));
    }


    const fieldTypeReturn = (fieldType, field) => {
        const _id = field.labelName.split(" ").join();

        switch(fieldType){
            case "Text Field":
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${contactErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='text'/>
                    {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                </div>
            )
            case "Email":
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${contactErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='email'/>
                    {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                </div>
            )

            case "Currency":
                return(
                    <CurrencyInput _id={_id} field={field} currencyData={currencyData} contactErrors={contactErrors} handleInputChange={handleInputChange} contactInput={contactInput} contactId={contactId} />
                )

            case "Number":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <input 
                        className={`h-40px py-8px px-12px br-6px input-styles ${contactErrors[field.labelName] ? 'error-input' : '' }`} 
                        id={_id}
                        onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                        value={contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                        onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                        placeholder={`Type the ${field.labelName}`}
                        min="0"
                        type='number'/>
                        {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Text Area":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <textarea style={{resize:"vertical"}} className={`py-8px px-12px br-6px input-styles ta ${contactErrors[field.labelName] ? 'error-input' : '' }`} 
                            id={_id}
                            value={contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                            onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                            placeholder={`Type the ${field.labelName}`}
                        >
                            
                        </textarea> 
                        {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Dropdown":
                console.log(contactInput.userValues.find(item => item.labelName === field.labelName), "CONTACT INPUT")
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
                            value={contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? 
                                {label: contactInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "", 
                                value: contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: contactErrors[field.labelName] ? 'var(--error-50)' : 'transparent',
                                    borderColor: contactErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                            }}
                        />
                        {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                    </div>
                )

                case "Phone":
                    return (
                        <PhoneInput _id={_id} field={field} currencyData={currencyData} contactErrors={contactErrors} handleInputChange={handleInputChange} contactInput={contactInput} contactId={contactId}  />
                    )
           
                case "Users":
                return (
                    <div key={field._id}>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <Select 
                            isDisabled={!contactInput?.linkedCustomer || !teamMembersData}
                            placeholder={`Select the ${field.labelName}`}
                            onChange={(chosenOption)=>{
                                handleInputChange({value: chosenOption.value, labelName: field.labelName, field: field, isDynamic: true })
                            }}
                            options={teamMembersData}
                            components={{
                                IndicatorSeparator: () => null,
                            }}
                            value={contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? {
                                label: teamMembersData?.find(member => member.value === contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue)?.label || "", 
                                value: contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: contactErrors[field.labelName] ? 'var(--error-50)' : state.isDisabled? 'var(--grey-100)' : 'transparent',
                                    borderColor: contactErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                                menu: (baseStyles, state) => ({
                                    ...baseStyles, 
                                    zIndex: 2
                                })
                            }}
                        />
                        {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'>
                            <i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                        {contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
                    </div>
                )
    
            
            case "Date Picker":
                return ( <DatePickerGroup _id={_id} field={field} handleInputChange={handleInputChange} contactErrors={contactErrors} contactId={contactId} contactInput={contactInput} /> )
                
            case "Radio":
                return (
                    <RadioInput field={field} handleInputChange={handleInputChange} contactInput={contactInput} contactId={contactId} contactErrors={contactErrors} />
                )

            case "Checkbox":
                return (
                    <CheckboxInput field={field} handleInputChange={handleInputChange} contactInput={contactInput} contactId={contactId} contactErrors={contactErrors} />
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
                    </div>
                )
        }
    }



    const validateUserInputs = (userInputs) => {
        let errors = {};
    
        // Get required label names
        const requiredFields = contactFields
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
                } else if (item.type === "Checkbox") {
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
                    if ((!input.fieldValue || input.fieldValue.length < 2 ||  !input.fieldValue[0] || !input.fieldValue[1]) && !errors[item]) {
                        errors[item] = `${input.labelName} is a required field`;
                    }
                }
                else if ( input.labelName === item && requiredField.fieldType === "Phone"){
                    if ((!input?.fieldValue || input?.fieldValue.length < 2 ||  !input?.fieldValue[0] || !input?.fieldValue[1]) && !errors[item]) {
                        errors[item] = `${input.labelName} is a required field`;
                    }
                }else if(input.labelName === item && !input.fieldValue && !errors[item]){
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
    


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const _contactFields = await TemplateAPI.getTemplateByType("CONTACT");
                const currentCurrencyData = await CurrencyAPI.getCurrencies();
                //change this to get all customers
                const allCustomers = await  LeadsAPI.getAllCustomers();
                if(contactId){
                    const contactData = await ContactsAPI.getContactById(contactId);
                    
                    if( contactData?.data?.data?.linkedCustomer ){
                        console.log("SING CONT DATA",contactData?.data?.data?.linkedCustomer)
                        const customerData = await LeadsAPI.getCustomerById(contactData?.data?.data?.linkedCustomer?._id);
                       
                        setTeamMembersData(customerData?.data?.data?.linkedTeam?.members?.map(member => (
                            {value: member._id, label: member.firstName + " " + member.lastName })))
                    }
                    if(contactData.status === 200){
                        console.log("CUSPPP ",contactData.data.data)
                        setContactInput({
                            linkedCustomer: contactData?.data?.data?.linkedCustomer?._id || "", 
                            userValues: contactData.data.data.userValues.map(item => (
                                {labelName: item.labelName, fieldValue: item.fieldValue}
                            ))
                        })
                    }
                }
                if(allCustomers.status === 200){
                        const formattedCustomers = allCustomers?.data?.data?.map(customer => ({label: customer.userValues.find(item => item.labelName === "Customer Name").fieldValue, value: customer._id}))
                        if(formattedCustomers?.length < 1 ){
                            toast.error("Need Atleast one customer to add a contact")
                            handleModalClose()
                        }   
                        setCustomersData(formattedCustomers);    
                                      
                }
               
                if(currentCurrencyData.status === 200){
                    setCurrencyData(currentCurrencyData.data.data)
                }
                console.log(_contactFields, "_DATAID")
                if(_contactFields.status === 200){
                    let _data = [...(_contactFields?.data?.data?.formFields || [])]
                    console.log(_data, "_DATA")
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

                    setContactFields([...isDefault,...isRest]);
                }
                setLoading(false);
            }catch(err){
                setLoading(false);
                console.error(err)
            }
        })()
    },[])

    useEffect(()=>{
        if(submitContact){
            const errors = validateUserInputs(contactInput)
            console.log("THE ERRORS CONTACT : ",errors);
            setContactErrors(errors);
            if(Object.keys(errors).length > 0){
                setSubmitContact(false);
                return;
            }
            try{
                setLoading(true);
                console.log("CREATED CONTACT RESP 123 :: ",contactId);

                (async () => {
                    console.log("CREATED CONTACT RESP 1 :: ",contactId);

                    if(contactId){
                        const contactUpdated = await ContactsAPI.updateContact(contactId, contactInput);
                        if(contactUpdated.status === 200){
                            if(!setOverviewData){
                                if(currentPage === 1){
                                    handleFilterContacts()
                                }else{
                                    setCurrentPage(1)
                                }
                                handleModalClose();
                            }else{
                                const contactData = await ContactsAPI.getContactById(contactId);
                                if(contactData.status === 200){
                                    setOverviewData(contactData.data.data)
                                    handleModalClose()
                                }
                            }
                        }
                    }else{
                        const createdContact = await ContactsAPI.createContact(contactInput);
                        if(createdContact.status === 200){
                            const allContacts = await ContactsAPI.getAllContacts({queries: {pageSize: PageSize, currentPage: 1}})
                            if(allContacts.status === 200){
                                handleFilterContacts({clear: true})
                                handleModalClose();  
                            }
                        }
                    }
                    setSubmitContact(false);
                    setLoading(false);
                })()
            }catch(err){
                handleModalClose();
                setSubmitContact(false);
                console.error(err, "::ERROR")      
            }
        }

    },[submitContact])
    

    return (
        <div id="calendar-portal" className='p-16px h-max-content'>
            {console.log(contactId , contactFields?.length, contactInput, "contid")}
            {loading ? <Loader /> : 
            (!contactId && contactFields?.length > 0) || (contactId && contactFields?.length > 0 && contactInput) ? 
             <div className=''> 
                <div className='d-flex flex-column '>
                    <label className='fw-500 mb-6px' htmlFor="linkedCustomer">Related Customer</label>
                    {customersData?.length > 0 ? <Select 
                        components={{
                            IndicatorSeparator: () => null,
                        }}
                        placeholder='Select a Customer'
                        defaultValue={!contactId ? null :{value: contactInput.linkedCustomer, label: customersData.find(customer => customer.value === contactInput.linkedCustomer)?.label}}
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                backgroundColor: contactErrors.linkedCustomer ? 'var(--error-50)' : 'transparent',
                                borderColor: contactErrors.linkedCustomer ? 'var(--error-500)' : 'hsl(0, 0%, 80%)',
                            }),
                        }}
                        onChange={(chosenOption) => {
                            console.log("LOGG IT", chosenOption.value)
                            handleInputChange({
                                value: chosenOption.value,
                                labelName: "linkedCustomer",
                            });
                        }}
                        options={customersData} 
                    /> : <p>No Customers Yet</p>}

                    {contactErrors.linkedCustomer && <p className='error-txt'>{contactErrors.linkedCustomer}</p>}
                </div>
                { contactFields.map((field, i) => {
                    if(!field.isSensitive || (field.isSensitive && field.writeAccessRoles.includes(currentUserData?.userRole)) || ADMIN_ROLES.includes(currentUserData?.userRole)){
                        if (i !== defaultCount) {
                            return fieldTypeReturn(field.fieldType, field)
                        } else {
                            return <>
                                <p className='mt-5 fw-bold mb-0'>Additional Details:</p>
                                {fieldTypeReturn(field.fieldType, field)}
                            </>
                        }
                    }else{
                        return null
                    }
                })}
             </div>
            : <p>No Fields Yet</p>}
        </div>
    );
};

const RadioInput = ({ field, handleInputChange, contactErrors, _id, contactId, contactInput }) => {
    const radioState = contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "";

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
            {contactErrors[field.labelName] && <p className='error-txt'>You have not selected an option</p>}
        </div>
    )
}



const CheckboxInput = ({ field, handleInputChange, contactErrors, _id, contactId, contactInput }) => {
    const checkboxState = contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || [];


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
            {contactErrors[field.labelName] && <p className='error-txt'>You have not selected any options</p>}
        </div>
    );
};



const CurrencyInput = ({ field, currencyData, _id, contactErrors, handleInputChange, contactInput, contactId }) => {
    const optionsData = currencyData.map((currency) => ({ label: currency.currencyValue, value: currency.currencyValue }));
    console.log(contactInput, "contttaaact inpuuut");
    const [chosenCurrency, setChosenCurrency] = useState(!contactId ? optionsData[0].value :  (contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1] || optionsData[0].value))
    const [numberInput, setNumberInput] = useState(!contactId ? "" : (contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[0] || ""));

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div className='d-flex position-relative'>
                <input
                    className={`h-40px w-100 py-8px px-12px pr-90px br-6px input-styles ${contactErrors[field.labelName] ? 'error-input' : ''}`}
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
                            control:(baseStyles, state) => ({ ...baseStyles, border: state.isFocused ? "none" : "none", boxShadow: state.isFocused ? 0 : 0, }),
                            valueContainer: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            clearIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            singleValue: (baseStyles) => ({ ...baseStyles, width: "50px" }),
                            dropdownIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                            menu: (baseStyles) => ({
                                ...baseStyles,
                                position: "absolute",
                                minWidth: "100px",
                                right: 0,
                                zIndex: 100
                              })
                        }}
                        options={optionsData}
                    />

                    </div>
                
            </div>
            {contactErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
        </div>
    );
};


const CustomCalendarInput = forwardRef((props, ref) => {
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "40px", borderRadius: "6px", backgroundColor: props.contactErrors[props.field.labelName] ? "var(--error-50)" : "transparent", border: props.contactErrors[props.field.labelName] ? "1px solid var(--error-500)" : "1px solid var(--gray-300, #D0D5DD)" }} {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "8px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} className="ri-calendar-event-line"></i>
        </div>
    );
  });

  const PhoneInput = ({ field, _id, contactErrors, handleInputChange, contactInput, contactId }) => {
    const [chosenCountry, setChosenCountry] = useState(!contactId ? phoneData[0].value :  ( contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1] || phoneData[0]?.value))
    const [phoneInput, setPhoneInput] = useState(!contactId ? "" : (contactInput?.userValues?.find(item => item.labelName === field.labelName)?.fieldValue[0] || 0));
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
                    <p style={{left: "12px", top: '8px'}} className="position-absolute color-grey-500">{'+' + phoneCodeNumber}</p>
                    <input
                        className={`h-40px w-100 py-8px pr-12px ${ phoneCodeNumber?.length > 3 ? 'pl-75px' : phoneCodeNumber?.length > 2 ? 'pl-60px' : 'pl-50px'} br-6px input-styles ${contactErrors[field.labelName] ? 'error-input' : ''}`}
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
            {contactErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
            </div>
    );
};
  

const DatePickerGroup = ({field, _id, handleInputChange, contactErrors, contactInput, contactId}) => {
    const [startDate, setStartDate] = useState( !contactId ? null: contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? moment(contactInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue, 'DD/MM/YYYY').toDate() : null);
    const inputRef = useRef(null);

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div>
                <DatePicker
                    customInput={ <CustomCalendarInput contactErrors={contactErrors} field={field} inputRef={inputRef}/>}
                    dateFormat="dd/MM/yyyy"
                    selected={startDate}
                    onChange={(date)=>{
                        setStartDate(date)
                        handleInputChange({value: moment(date).format('DD/MM/YYYY'), 
                        labelName: field.labelName, field: field, isDynamic: true })
                    }} 
                />
                { contactErrors[field.labelName] && <p className='error-txt'>{contactErrors[field.labelName]}</p>}
            </div>
        </div>
    )
}

export default NewContactForm;
