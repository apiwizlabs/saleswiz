import React, { useEffect, useState, } from 'react';
import UncheckedBox from '../../assets/icons/small-unchecked.svg';
import CheckedBox from '../../assets/icons/small-checked.svg';
import Select, {MenuPlacement} from 'react-select'
import { TemplateAPI } from '../../api/apiConfig';
import { convertValueIntoLabel } from '../../utils';
import { rolesOptions } from '../../utils/constants';

const CreateNewField = ({submitForm, setSubmitForm, setTemplateData, formType, editFieldData, onClose, isFieldDefault}) => {
    //TODO: checkbox is not multiple

    const menuPlacement = 'bottom';
    const fieldTypesOptions = [
        {
            "label": "Text Field",
            "value": "Text Field"
        },
        {
            "label": "Number",
            "value": "Number"
        },
        {
            "label": "Email",
            "value": "Email"
        },
        {
            "label": "Phone",
            "value": "Phone"
        },
        {
            "label": "Users",
            "value": "Users"
        },
        {
            "label": "Text Area",
            "value": "Text Area"
        },
        {
            "label": "Dropdown",
            "value": "Dropdown"
        },
        {
            "label": "Checkbox",
            "value": "Checkbox"
        },
        {
            "label": "Radio",
            "value": "Radio"
        },
        {
            "label": "Date Picker",
            "value": "Date Picker"
        },
        {
            "label": "Currency",
            "value": "Currency"
        }
    ]
   
    const multiValueTypes = [
        "Dropdown",
        "Radio"
    ]
    const MultiValueContainer = props => {
        return null;
    };
    const editFieldValues = editFieldData?.fieldData;

    const initialData = editFieldValues ? 
        {
            ...editFieldValues, 
            fieldType: {
                label: editFieldValues?.fieldType, 
                value: editFieldValues?.fieldType 
            }, 
            readAccessRoles: editFieldValues?.readAccessRoles?.map(item => ({value: item, label: convertValueIntoLabel(item)})), 
            writeAccessRoles: editFieldValues?.writeAccessRoles?.map(item => ({value: item, label: convertValueIntoLabel(item)})) 
        }  : {
            labelName: "",
            toolTip: "",
            fieldType: "",
            isMandatory: false,
            needsApproval: false,
            isSensitive: false,
            isDefault: isFieldDefault,
            isTechnicalInfo: false,
            valueOptions: [],
            readAccessRoles: [],
            writeAccessRoles: []
        }

    const [newFieldInput, setNewFieldInput] = useState(initialData);
    const [formFieldErrors, setFormFieldErrors] = useState(false);


    const handleFormFieldInput = (evt) => {
        const { name, value } = evt.target;
        setNewFieldInput({ ...newFieldInput, [name]: value });
    }

    const validate = (values) => {
        const errors = {}
        if(!values.labelName){
          errors.labelName = "Password is required"
        }
        if(!values.toolTip){
          errors.toolTip = "Tooltip is required"
        }
        if(!values.fieldType){
          errors.fieldType = "FieldType is required"
        } 
        if(multiValueTypes.includes(values.fieldType.value)){
            const optionList = newFieldInput?.valueOptions.filter(item => item.trim());
            if(optionList.length < newFieldInput?.valueOptions.length){
                errors.valueOptions = "All Options need to have a value"
            }else if(optionList.length < 2){
                errors.valueOptions = "Need atleast two valid options"
            }
            // setNewFieldInput(prev => ({...prev, valueOptions: optionList}));
        }
        if(values.fieldType.value === "Checkbox"){
             const optionList = newFieldInput?.valueOptions.filter(item => item.trim());
             if(optionList.length < newFieldInput?.valueOptions.length){
                errors.valueOptions = "All Options need to have a value"
            }
             else if(optionList.length < 1){
                errors.valueOptions = "Need atleast one valid option"
            }
            // setNewFieldInput(prev => ({...prev, valueOptions: optionList}));        
        }
        if(values.isSensitive){
            if(values.readAccessRoles.length <= 0){
                errors.readAccessRoles = "Need atleast one role"
            }
            if(values.writeAccessRoles.length <= 0){
                errors.writeAccessRoles = "Need atleast one role"
            }

        }
        return errors;
      }

      const filterArrayOfObjects = (inputArray) => {
        const uniqueValues = {};
       return inputArray.filter(item => {
            if (!uniqueValues[item.value]) {
                uniqueValues[item.value] = true;
                return true;
            }
            return false;
            })
      }


    useEffect(()=>{
        if(submitForm){
            (async ()=>{
                const errors = validate(newFieldInput);
                if(Object.keys(errors).length > 0){
                    setFormFieldErrors(errors);
                    setSubmitForm(false);
                  return;
                }
                setFormFieldErrors(errors);
                try{
                    const readAccessRoles = newFieldInput?.readAccessRoles?.map(item => item.value);
                    const writeAccessRoles = newFieldInput?.writeAccessRoles?.map(item => item.value);
                    const fieldType = newFieldInput?.fieldType?.value;
                    const apiFieldInput = {...newFieldInput, readAccessRoles, writeAccessRoles, fieldType };


                    if(editFieldData?.show){
                        
                        const updatedFormField = await TemplateAPI.updateFormField(formType.value.toLowerCase(), apiFieldInput);
                        const templateData = await TemplateAPI.getTemplateByType(formType.value.toLowerCase());
                        if(templateData.status === 200){
                            setTemplateData(templateData?.data?.data?.formFields);
                        }
                        onClose()
                        setSubmitForm(false);
                    }else{
                        const createFormField = await TemplateAPI.createFormField(formType.value.toLowerCase(), apiFieldInput);
                        const templateData = await TemplateAPI.getTemplateByType(formType.value.toLowerCase());
                        if(templateData.status === 200){
                            setTemplateData(templateData?.data?.data?.formFields);
                        }

                        onClose()
                        setSubmitForm(false);

                    }


                }catch(err){
                    setSubmitForm(false);
                  console.error(err, "::ERROR")      
                }
            })()
        }
    },[submitForm])


  



    return (
        <div className='px-20px py-16px d-flex flex-column'>
            <label className='fw-500 mb-6px mt-16px' htmlFor='labelName'>Field Name</label>
            <input className={`h-40px py-8px px-12px br-6px input-styles ${editFieldData ? 'disabled' : ''} ${formFieldErrors?.labelName ? 'error-input' : ''}`} id="labelName"
            name="labelName"
            disabled={editFieldData ? true : false}
            value={newFieldInput.labelName}
            onChange={handleFormFieldInput} placeholder='Type Field Name' type='text' />
            {formFieldErrors?.labelName && <p className='error-txt'>{formFieldErrors.labelName}</p>}


            <label className='fw-500 mb-6px mt-20px' htmlFor='tooltip'>Tooltip</label>
            <input className={`h-40px py-8px px-12px br-6px input-styles ${formFieldErrors?.toolTip ? 'error-input' : ''}`} id="tooltip"
                name="toolTip"
                value={newFieldInput.toolTip}
                onChange={handleFormFieldInput} placeholder='Type Tooltip Text' type='text' />
            {formFieldErrors?.toolTip && <p className='error-txt'>{formFieldErrors.toolTip}</p>}



            <label className='fw-500 mb-6px mt-20px' htmlFor='fieldType'>Field Type</label>
            <Select
                className={`basic-single`}
                classNamePrefix="select"
                components={{
                    IndicatorSeparator: () => null
                }}
                menuPortalTarget={document.body}
                menuPosition='absolute'
                menuPlacement={menuPlacement}
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: formFieldErrors?.fieldType ? 'var(--error-50)' : 'transparent',
                        borderColor: formFieldErrors?.fieldType ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 1000 }),
                }}
                value={newFieldInput?.fieldType}
                isSearchable={true}
                onChange={(chosenOption)=>{
                    if(chosenOption.value){
                        delete formFieldErrors.fieldType
                        setFormFieldErrors(formFieldErrors)
                    }
                    if(chosenOption.value === "Checkbox") {
                        newFieldInput.valueOptions = [""]
                    }else if(multiValueTypes.includes(chosenOption.value)){
                        newFieldInput.valueOptions = ["",""]
                    }else{
                        newFieldInput.valueOptions = []
                    }
                    setNewFieldInput({...newFieldInput, fieldType: chosenOption})
                }}
                name="fieldType"
                placeholder="Choose Field Type"
                options={fieldTypesOptions}
            />
                {formFieldErrors?.fieldType && <p className='error-txt'>{formFieldErrors.fieldType}</p>}

            {newFieldInput?.valueOptions?.length > 0 && 
            <div className='d-flex flex-column mt-20px'>
                {
                      newFieldInput?.valueOptions.map((valueOption, i) => {
                        return (
                            <div key={i} className='d-flex align-items-center gap-8px mb-8px'>
                            <input className={`h-40px w-100 py-8px px-12px br-6px input-styles ${formFieldErrors?.valueOptions ? 'error-input' : ''}`} id="valueOptions"
                                name="valueOptions"
                                value={valueOption}
                                onChange={(e)=>{
                                    let _valueOptions = newFieldInput.valueOptions;
                                    _valueOptions[i] = e.target.value
                                    setNewFieldInput({...newFieldInput, valueOptions: _valueOptions})}} 
                                    placeholder='Type Option Content' type='text' />
                            <i onClick={()=>{
                                if (newFieldInput.valueOptions.length - 1 >= i) { // only splice array when item is found
                                    let _valueOptions = newFieldInput.valueOptions
                                    _valueOptions.splice(i, 1); // 2nd parameter means remove one item only
                                    setNewFieldInput({...newFieldInput, valueOptions: _valueOptions})
                                }
                            }} className="ri-delete-bin-5-line cursor fs-20px lh-20px color-error-red "></i>
                            </div>
                        )
                    }) 
                }
            </div>
          
        
        }
            
           
           {(multiValueTypes.includes(newFieldInput.fieldType?.value) || newFieldInput.fieldType?.value === "Checkbox") && 
           <div onClick={()=>{
                setNewFieldInput({...newFieldInput, valueOptions: [...newFieldInput.valueOptions, ""]})
            }} className='d-flex w-max-content cursor'>
                <i className="ri-add-line fs-20px lh-20px"></i><p className='fs-14px color-grey-700 fw-500'>Add field</p>
            </div>}
            {formFieldErrors?.valueOptions && <p className='error-txt'>{formFieldErrors.valueOptions}</p>}
         



            <div className={`d-flex gap-8px mt-21px`}>
                <img className='cursor' onClick={() => setNewFieldInput({ ...newFieldInput, isMandatory: !newFieldInput.isMandatory })} src={newFieldInput.isMandatory ? CheckedBox : UncheckedBox} />
                <p onClick={() => setNewFieldInput({ ...newFieldInput, isMandatory: !newFieldInput.isMandatory })} className='cursor color-grey-900 fs-16px'>Make this a required field</p>
            </div>
            {formType.value.toLowerCase() === "customer" && <div className={`d-flex gap-8px mt-21px`}>
                <img className='cursor' onClick={() => setNewFieldInput({ ...newFieldInput, isTechnicalInfo: !newFieldInput.isTechnicalInfo })} src={newFieldInput.isTechnicalInfo ? CheckedBox : UncheckedBox} />
                <p onClick={() => setNewFieldInput({ ...newFieldInput, isTechnicalInfo: !newFieldInput.isTechnicalInfo })} className='cursor color-grey-900 fs-16px'>Make this a technical info field</p>
            </div>}

            <p className='color-grey-700 fs-16px fw-500 mt-17px'>Access Details</p>
            <div className='d-flex gap-8px mt-12px'>
                <img className='cursor' onClick={() => setNewFieldInput({ ...newFieldInput, isSensitive: !newFieldInput.isSensitive })} src={newFieldInput.isSensitive ? CheckedBox : UncheckedBox} />
                <p onClick={() => {
                    if(newFieldInput.isSensitive){
                        setNewFieldInput(prev => ({...prev, readAccessRoles: [], writeAccessRoles: []}));
                    }
                    setNewFieldInput({ ...newFieldInput, isSensitive: !newFieldInput.isSensitive, readAccessRoles: [], writeAccessRoles: [] })}} 
                    className='cursor color-grey-900 fs-16px'>Sensitive</p>
            </div>

            {newFieldInput.isSensitive &&
                <div>
                    <label className='fw-500 mb-6px mt-12px' htmlFor='labelName' >Read Access</label>
                    <Select 
                        value={newFieldInput.readAccessRoles}
                        isMulti
                        isClearable={false}
                        name="readAccessRoles"
                        menuPortalTarget={document.body}
                        menuPosition='absolute'
                        menuPlacement={menuPlacement}
                        components={{
                            MultiValueContainer,
                            IndicatorSeparator: () => null
                        }}
                        onChange={(chosenOption) => {
                            setNewFieldInput(prev => ({ ...prev, readAccessRoles: chosenOption }))
                        }}
                        styles={{
                            multiValue: (base) => ({
                                ...base,
                                margin: 0,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                backgroundColor: formFieldErrors?.readAccessRoles ? 'var(--error-50)' : 'transparent',
                                borderColor: formFieldErrors?.readAccessRoles ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                            })
                        }}
                        options={rolesOptions.filter(item => (item.value !== "ADMIN" && item.value !== "ORG_OWNER"))}
                        placeholder="Read Access"
                        className="basic-multi-select"
                        classNamePrefix="select"
                    />
                                {formFieldErrors?.readAccessRoles && <p className='error-txt'>{formFieldErrors.readAccessRoles}</p>}


                    {newFieldInput?.readAccessRoles?.length > 0 &&
                        <div className='d-flex flex-wrap gap-6px mt-6px'>
                            {newFieldInput?.readAccessRoles.map(member => {
                                return (
                                    <div className='d-flex multi-item'>
                                        <p className='fs-14px color-grey-700 fw-500 mr-16px'>{member.label}</p>
                                        <i onClick={() => { setNewFieldInput(prev => ({ ...prev, readAccessRoles: prev.readAccessRoles.filter(item => item.value !== member.value) })) }} 
                                        className="ri-close-line fs-12px p-2px lh-16px"></i>
                                    </div>
                                )
                            })}
                        </div>
                    }

                        <label className='fw-500 mb-6px mt-16px' htmlFor='labelName'>Write Access</label>
                        <Select 
                            value={newFieldInput.writeAccessRoles}
                            isMulti
                            isClearable={false}
                            name="writeAccessRoles"
                            menuPortalTarget={document.body}
                            menuPosition='absolute'
                            menuPlacement='top'
                            components={{
                                MultiValueContainer,
                                IndicatorSeparator: () => null
                            }}
                            onChange={(chosenOption) => {
                                setNewFieldInput(prev => ({ ...prev, writeAccessRoles: chosenOption, readAccessRoles: filterArrayOfObjects([...newFieldInput.readAccessRoles, ...chosenOption]) }))
                            }}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: formFieldErrors?.writeAccessRoles ? 'var(--error-50)' : 'transparent',
                                    borderColor: formFieldErrors?.writeAccessRoles ? 'var(--error-500) !important' : 'hsl(0, 0%, 80%)',
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                multiValue: (base) => ({
                                    ...base,
                                    margin: 0,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                }),
                            }}
                            options={rolesOptions.filter(item => (item.value !== "ADMIN" && item.value !== "ORG_OWNER"))}
                            placeholder="Write Access"
                            className="basic-multi-select"
                            classNamePrefix="select"
                        />
                        {formFieldErrors?.writeAccessRoles && <p className='error-txt'>{formFieldErrors.writeAccessRoles}</p>}

                        {newFieldInput?.writeAccessRoles?.length > 0 &&
                            <div className='d-flex flex-wrap gap-6px mt-6px'>
                                {newFieldInput?.writeAccessRoles.map(member => {
                                    return (
                                        <div className='d-flex multi-item'>
                                            <p className='fs-14px color-grey-700 fw-500 mr-16px'>{member.label}</p>
                                            <i onClick={() => { setNewFieldInput(prev => ({ ...prev, writeAccessRoles : prev.writeAccessRoles.filter(item => item.value !== member.value) })) }} 
                                            className="ri-close-line fs-12px p-2px lh-16px"></i>
                                        </div>
                                    )
                                })}
                            </div>
                        }
                    </div>
            }

           {(formType.value.toLowerCase() === "deal") && <div className='d-flex gap-8px mt-12px'>
                <img className='cursor'
                    onClick={() => setNewFieldInput({ ...newFieldInput, needsApproval: !newFieldInput.needsApproval })}
                    src={newFieldInput.needsApproval ? CheckedBox : UncheckedBox} />
                <p onClick={() => setNewFieldInput({ ...newFieldInput, needsApproval: !newFieldInput.needsApproval })}
                    className='color-grey-900 fs-16px cursor'>Needs Approval from sales owner</p>
            </div>}
        </div>
    );
};

export default CreateNewField;