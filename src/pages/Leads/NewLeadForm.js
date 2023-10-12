import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { CurrencyAPI, LeadsAPI, TeamAPI, TemplateAPI } from '../../api/apiConfig';
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
import { ADMIN_ROLES, PageSize, SALES_OWNER } from '../../utils/constants';
import {toast} from 'react-toastify';
import { emailRegex } from '../../utils';
import { phoneData } from '../../utils/countryCodes';

const NewLeadForm = ({submitLead, currentPage, setCurrentPage, setSubmitLead, setOverviewData, setLeadsData, handleModalClose, customerId, handleFilterLeads}) => {

    const [customerFields, setCustomerFields] = useState(null);
    const [customerFields2, setCustomerFields2] = useState([])
    const [currentUserData, setCurrentUserData] = useOutletContext();
    const [loading, setLoading] = useState(false);
    const [leadInput, setLeadInput] = useState(customerId ? null : {userValues:[]});
    const [leadErrors, setLeadErrors] = useState({});
    const [currencyData, setCurrencyData] = useState(null);
    const [teamsData, setTeamsData] = useState(null)
    const [defaultCount, setDefaultCount] = useState(0)
    const [defaultCount2, setDefaultCount2] = useState(0);
    const [teamMembersData, setTeamMembersData] = useState([])

    const handleInputChange =async ({value , labelName, field, isDynamic}) => {
        if(isDynamic){

            let dynamicInputs = leadInput.userValues;
            let flag = false;
            for(let i = 0; dynamicInputs.length > i; i++){
                if(dynamicInputs[i].labelName === labelName){
                    flag = true;
                    if(field.fieldType === "Currency" ){
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
                if(field.fieldType === "Currency" ){
                    if(value?.currency){ 
                        dynamicInputs.push({fieldValue: ["", value?.currency], type:field.fieldType , labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                    else if(value?.number){
                        dynamicInputs.push({fieldValue: [value?.number, ""], type:field.fieldType, labelName: labelName, templateFieldId: field._id, isMandatory: field.isMandatory});
                    }
                }else if(field.fieldType === "Phone"){
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
          
            setLeadInput(prev => ({...prev, userValues: dynamicInputs}));
            return;
        }
        if(labelName === "linkedTeam"){
            console.log(value, "Customer Value");
            try{
                const teamData = await TeamAPI.getTeamById(value);
                console.log(teamData, "TEAM DATA SINGLE");
                setTeamMembersData(teamData?.data?.data?.members?.map(member => ({value: member._id, label: member.firstName + " " + member.lastName })))

            }catch(err){
                console.log(err)
            }
            
        }
        setLeadInput(prev => ({...prev, [labelName]: value}));
    }


    const fieldTypeReturn = (fieldType, field) => {
        const _id = field.labelName.split(" ").join();

        switch(fieldType){
            case "Text Field":
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={leadInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='text'/>
                    {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                </div>
            )

            case "Email":
                return ( 
                <div key={field._id} className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                    <input 
                    className={`h-40px py-8px px-12px br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : '' }`} 
                    id={_id}
                    value={leadInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                    onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                    placeholder={`Type the ${field.labelName}`}
                    type='email'/>
                    {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                </div>
            )

            case "Currency":
                return(
                    <CurrencyInput _id={_id} field={field} currencyData={currencyData} leadErrors={leadErrors} handleInputChange={handleInputChange} leadInput={leadInput} customerId={customerId} />
                )

            case "Number":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <input 
                        className={`h-40px py-8px px-12px br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : '' }`} 
                        id={_id}
                        onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                        value={leadInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                        onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                        placeholder={`Type the ${field.labelName}`}
                        min="0"
                        type='number'/>
                        {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                    </div>
                )
            
                case "Users":
                    return (
                        <div key={field._id}>
                            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                            <Select 
                                isDisabled={!leadInput?.linkedTeam || !teamMembersData}
                                placeholder={`Select the ${field.labelName}`}
                                onChange={(chosenOption)=>{
                                    handleInputChange({value: chosenOption.value, labelName: field.labelName, field: field, isDynamic: true })
                                }}
                                options={teamMembersData}
                                components={{
                                    IndicatorSeparator: () => null,
                                }}
                                value={leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? {
                                    label: teamMembersData?.find(member => member.value === leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue)?.label || "", 
                                    value: leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                                styles={{
                                    control: (baseStyles, state) => ({
                                        ...baseStyles,
                                        backgroundColor: leadErrors[field.labelName] ? 'var(--error-50)' :  state.isDisabled? 'var(--grey-100)' : 'transparent',
                                        borderColor: leadErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                    }),
                                    menu: (baseStyles, state) => ({
                                        ...baseStyles,
                                       zIndex: 1000,
                                    }),
                                }}
                            />
                            {field?.needsApproval && <p className='color-grey-600 fs-14px mt-6px'>
                                <i class="ri-alert-line fs-16px lh-16px"></i>This field needs approval from Sales Owner.</p>}
                            {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                        </div>
                    )
            
            case "Text Area":
                return ( 
                    <div key={field._id} className='d-flex flex-column '>
                        <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
                        <textarea style={{resize:"vertical"}} className={`ta py-8px px-12px br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : '' }`} 
                            id={_id}
                            value={leadInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""}
                            onChange={(e)=>handleInputChange({value: e.target.value, labelName: field.labelName, field: field, isDynamic: true })} 
                            placeholder={`Type the ${field.labelName}`}
                        >
                            
                        </textarea> 
                        {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                    </div>
                )
                case "Phone":
                    return (
                        <PhoneInput _id={_id} field={field} leadErrors={leadErrors} handleInputChange={handleInputChange} leadInput={leadInput} leadId={customerId}  />
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
                            value={leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue ? 
                                {label: leadInput.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "", value: leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || ""} : null}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: leadErrors[field.labelName] ? 'var(--error-50)' : 'transparent',
                                    borderColor: leadErrors[field.labelName] ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                            }}
                        />
                        {leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
                    </div>
                )
            
            case "Date Picker":
                return ( <DatePickerGroup _id={_id} field={field} handleInputChange={handleInputChange} leadErrors={leadErrors} customerId={customerId} leadInput={leadInput} /> )
                
            case "Radio":
                return (
                    <RadioInput field={field} handleInputChange={handleInputChange} leadInput={leadInput} customerId={customerId} leadErrors={leadErrors} />
                )

            case "Checkbox":
                return (
                    <CheckboxInput field={field} handleInputChange={handleInputChange} leadInput={leadInput} customerId={customerId} leadErrors={leadErrors} />
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
    
        // Check if linkedTeam is missing
        if (!userInputs.linkedTeam) {
            errors.linkedTeam = "Team is Required.";
        }
    
        // Get required label names
        const requiredFields1 = customerFields
            .filter((curr) => curr.isMandatory && (!curr.isSensitive || curr.writeAccessRoles.includes(currentUserData.userRole)))

        const requiredFields2 = customerFields2
        .filter((curr) => curr.isMandatory && (!curr.isSensitive || curr.writeAccessRoles.includes(currentUserData.userRole)))

        const requiredFields = [...requiredFields1, ...requiredFields2]
            
        const requiredLabelNames = requiredFields.map((curr) => curr.labelName);
    
        // Validate userValues
        for (let item of userInputs.userValues) {
            if(item.type === "Email" && item.fieldValue && !emailRegex.test(item.fieldValue)){
                errors[item.labelName] = "Enter a valid Email"
            }
            if (item.isMandatory && requiredLabelNames.includes(item.labelName)) {
                if (item.type === "Currency") {
                    if (!item.fieldValue || !item.fieldValue[0] || !item.fieldValue[1]) {
                        errors[item.labelName] = `${item.labelName} is a required field`;
                    }
                } else if (item.type === "Checkbox" || item.type === "Phone") {
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
                } else if ( input.labelName === item && requiredField.fieldType === "Phone"){
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
        if(!userInputs.linkedTeam){
            errors.linkedTeam = "Assign Team is a required field."
        }
    
        return errors;
    };
    


    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const _customerFields = await TemplateAPI.getTemplateByType("CUSTOMER");
                const currentCurrencyData = await CurrencyAPI.getCurrencies();
                const teamsData = await TeamAPI.getAllTeams();
               
                if(customerId){
                    const customerData = await LeadsAPI.getCustomerById(customerId);
                    if(customerData.status === 200){
                        console.log(customerData?.data?.data?.userValues, "CUST DATA !)!");
                        if(customerData?.data?.data?.linkedTeam){
                            console.log(customerData?.data?.data?.linkedTeam, "TEAM DATA");
                            setTeamMembersData(customerData?.data?.data?.linkedTeam?.members?.map(member => (
                                {value: member._id, label: member.firstName + " " + member.lastName })))
                            }
                        setLeadInput({
                            linkedTeam: customerData?.data?.data?.linkedTeam ? customerData?.data?.data?.linkedTeam._id : null, 
                            userValues: customerData?.data?.data?.userValues?.map(item => (
                                {labelName: item?.labelName, fieldValue: item?.fieldValue}
                            ))
                        })
                    }
                }
                console.log("TEAMS DATA : ",teamsData);
                console.log(_customerFields, "CUST FIELD STATUS");
               
                if(teamsData.status === 200){
                    console.log("TEAMS DATA : ",teamsData);
                    if(teamsData?.data?.data?.length < 1){
                        handleModalClose();
                        toast.error("Need atleast one team ", {autoClose: false})
                    }
                    setTeamsData(teamsData.data.data)
                }
                if(currentCurrencyData.status === 200){
                    setCurrencyData(currentCurrencyData.data.data)
                }

                if(_customerFields.status === 200){
                    console.log(_customerFields?.data?.data?.formFields, "FORM CUSTS RZN");

                    let _data = [...(_customerFields?.data?.data?.formFields || [])]
                    let isDefault = []
                    let isRest = []
                    let isDefault2 = []
                    let isRest2 = []

                    _data.forEach((each) => {
                        if (each.isTechnicalInfo){
                            if (each.isDefault){
                                isDefault2.push(each)
                            } else {
                                isRest2.push(each)
                            }
                        } else {
                            if (each.isDefault){
                                isDefault.push(each)
                            } else {
                                isRest.push(each)
                            }
                        }
                    })
                    setDefaultCount(isDefault.length)
                    setDefaultCount2(isDefault2.length)
                    setCustomerFields([...isDefault,...isRest]);
                    setCustomerFields2([...isDefault2,...isRest2])
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])

    // useEffect(()=>{console.log(leadInput, "LEAD INPU");},[leadInput])

    useEffect(()=>{
        if(submitLead){
            const errors = validateUserInputs(leadInput)
            setLeadErrors(errors);
            if(Object.keys(errors).length > 0){
                setSubmitLead(false);
                return;
            }
            try{
                setLoading(true);
                (async () => {
                    if(customerId){
                        const customerCreated = await LeadsAPI.updateCustomer(customerId, leadInput);
                        if(customerCreated.status === 200){
                            if(!setOverviewData){
                                if(currentPage === 1){
                                    handleFilterLeads();
                                }else{
                                    setCurrentPage(1);
                                }
                                handleModalClose();
                            }else{
                                const customerData = await LeadsAPI.getCustomerById(customerId);
                                if(customerData.status === 200){
                                    setOverviewData(customerData.data.data)
                                    handleModalClose()
                                }
                            }
                        }
                    }else{
                        const customerCreated = await LeadsAPI.createCustomer(leadInput);
                        if(customerCreated.status === 200){
                            handleFilterLeads({clear: true})
                            handleModalClose()
                        }
                    }
                    setSubmitLead(false);
                    setLoading(false)
                })()
            }catch(err){
                handleModalClose()
                setSubmitLead(false);
            }
        }

    },[submitLead])

    const [activeSection, setActiveSection] = useState("Customer Info")
    

    return (
        <div id="calendar-portal" className='p-16px h-max-content'>

            {loading ? <Loader /> : 
            (!customerId && customerFields?.length > 0) || (customerId && customerFields?.length > 0 && leadInput) ? 
            <div className=''> 
                <div className='d-flex grey-divider'>
                    <div onClick={()=>setActiveSection("Customer Info")} className={`px-24px py-8px cursor ${activeSection === 'Customer Info' ? 'active-border-bottom' : ''}`}>
                        <p className={`fs-14px color-grey-700`}>Customer Info</p>
                    </div>
                    <div onClick={()=>{
                            setActiveSection("Technical Info");
                        }} className={`px-24px py-8px cursor ${activeSection === 'Technical Info' ? 'active-border-bottom' : ''}`}>
                        <p className={`fs-14px color-grey-700`}>Technical Info</p>
                    </div>
                </div>                
               {activeSection === "Customer Info" && <div className='d-flex flex-column '>
                    <label className='fw-500 mb-6px mt-16px' htmlFor="linkedTeam">Assigned Team</label>
                  {teamsData?.length > 0 ? <Select 
                        components={{
                            IndicatorSeparator: () => null,
                        }}
                        placeholder={`Select the Team`}
                        defaultValue={!customerId && !leadInput?.linkedTeam ? null : {value: leadInput.linkedTeam, label: teamsData?.find(team => team._id === leadInput?.linkedTeam)?.teamName}}
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                backgroundColor: leadErrors.linkedTeam ? 'var(--error-50)' : 'transparent',
                                borderColor: leadErrors.linkedTeam ? 'var(--error-500)' : 'hsl(0, 0%, 80%)',
                            }),
                        }}
                        
                        onChange={(chosenOption) => {
                            handleInputChange({
                                value: chosenOption.value,
                                labelName: "linkedTeam",
                            });
                        }}
                        options={teamsData.map(team => ({label: team.teamName, value: team._id}))} 
                    /> : <p>No Teams Found</p>}

                    {leadErrors.linkedTeam && <p className='error-txt'>{leadErrors.linkedTeam}</p>}
                </div>}
                { activeSection === "Customer Info" ?
                 customerFields.map((field, i) => {
                    if (i !== defaultCount) {
                        return fieldTypeReturn(field.fieldType, field)
                    } else {
                        return <>
                            <p className='mt-5 fw-bold mb-0'>Additional Details:</p>
                            {fieldTypeReturn(field.fieldType, field)}
                        </>
                    }
                    
                }) : customerFields2.map((field, i) => {
                    if (i !== defaultCount2) {
                        return fieldTypeReturn(field.fieldType, field)
                    } else {
                        return <>
                            <p className='mt-5 fw-bold mb-0'>Additional Details:</p>
                            {fieldTypeReturn(field.fieldType, field)}
                        </>
                    }
                })}
             </div>
            : <p>No Fields Yet</p>}
        </div>
    );
};

const RadioInput = ({ field, handleInputChange, leadErrors, _id, customerId, leadInput }) => {
    const radioState = leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || "";

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
            {leadErrors[field.labelName] && <p className='error-txt'>You have not selected an option</p>}
        </div>
    )
}


const PhoneInput = ({ field, _id, leadErrors, handleInputChange, leadInput, leadId }) => {
    const [chosenCountry, setChosenCountry] = useState(!leadId ? phoneData[0].value :  ( leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1] || phoneData[0]?.value))
    const [phoneInput, setPhoneInput] = useState(!leadId ? "" : (leadInput?.userValues?.find(item => item.labelName === field.labelName)?.fieldValue[0] || 0));
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
                        className={`h-40px w-100 py-8px pr-12px ${ phoneCodeNumber?.length > 3 ? 'pl-75px' : phoneCodeNumber?.length > 2 ? 'pl-60px' : 'pl-50px'} br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : ''}`}
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
            {leadErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
            </div>
    );
};


const CheckboxInput = ({ field, handleInputChange, leadErrors, _id, customerId, leadInput }) => {
    const checkboxState = leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue || [];
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
            {leadErrors[field.labelName] && <p className='error-txt'>You have not selected any options</p>}
        </div>
    );
};



const CurrencyInput = ({ field, currencyData, _id, leadErrors, handleInputChange, leadInput, customerId }) => {
    const optionsData = currencyData.map((currency) => ({ label: currency.currencyValue, value: currency.currencyValue }));
    const [chosenCurrency, setChosenCurrency] = useState(!customerId ? optionsData[0].value :  leadInput?.userValues.find(item => item.labelName === field.labelName)?.fieldValue[1])
    const [numberInput, setNumberInput] = useState(!customerId ? "" : leadInput?.userValues.find(item => item.labelName === field.labelName).fieldValue[0]);

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div className='d-flex position-relative'>
                <input
                    className={`h-40px w-100 pr-90px py-8px px-12px br-6px input-styles ${leadErrors[field.labelName] ? 'error-input' : ''}`}
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
                        dropdownIndicator: (baseStyles) => ({ ...baseStyles, padding: 0 }),
                        control:(baseStyles, state) => ({ ...baseStyles, border: state.isFocused ? "none" : "none", boxShadow: state.isFocused ? 0 : 0, }),
                        menu: (baseStyles) => ({
                            ...baseStyles,
                            position: "absolute",
                            minWidth: "100px",
                            right: 0,
                            zIndex: 100
                          }),
                        singleValue: (baseStyles) => ({ ...baseStyles, width: "50px" })
                    }}
                    options={optionsData}
                />
                </div>
              
            </div>
            {leadErrors[field.labelName] && <p className='error-txt'>{`${field.labelName} is a required field`}</p>}
        </div>
    );
};


const CustomCalendarInput = forwardRef((props, ref) => {
    console.log(props.leadErrors, "DATE PROPS");
    return (
        <div className='w-100 position-relative'>
            <input style={{width: "100%", padding: "8px 12px", paddingRight: "48px", height: "40px", borderRadius: "6px", backgroundColor: props.leadErrors[props.field.labelName] ? "var(--error-50)" : "transparent", border: props.leadErrors[props.field.labelName] ? "1px solid var(--error-500)" : "1px solid var(--gray-300, #D0D5DD)" }} {...props} ref={ref} />
            <i style={{position: "absolute", right: "12px", top: "8px", fontSize: "24px", lineHeight: "24px", color: "#6C737F"}} className="ri-calendar-event-line"></i>
        </div>
    );
  });
  

const DatePickerGroup = ({field, _id, handleInputChange, leadErrors, leadInput, customerId}) => {
    const [startDate, setStartDate] = useState( !customerId ? null: moment(leadInput?.userValues.find(item => item.labelName === field.labelName).fieldValue, 'DD/MM/YYYY').toDate());
    const inputRef = useRef(null);

    return (
        <div>
            <label className='fw-500 mb-6px mt-16px' htmlFor={_id}>{field.labelName}</label>
            <div>
                <DatePicker
                    customInput={ <CustomCalendarInput leadErrors={leadErrors} field={field} inputRef={inputRef}/>}
                    dateFormat="dd/MM/yyyy"
                    selected={startDate}
                    onChange={(date)=>{
                        console.log(date, "PICKER DATE");
                        setStartDate(date)
                        handleInputChange({value: moment(date).format('DD/MM/YYYY'), 
                        labelName: field.labelName, field: field, isDynamic: true })
                    }} 
                />
                { leadErrors[field.labelName] && <p className='error-txt'>{leadErrors[field.labelName]}</p>}
            </div>
        </div>
    )
}

export default NewLeadForm;