import React, {useEffect, useState} from 'react';
import Users from './Team-User/Users';
import Select, {components} from 'react-select'
import SideModal from '../../components/Modals/SideModal'
import CreateNewField from './CreateNewField';
import { TemplateAPI } from '../../api/apiConfig';
import {Loader} from "../../components/Loader";

const Fields = () => {
  
    const handleOptionClick = (option) => {
        setSelectedFormType(option);
    };

    const formTypes = [
        {
            value: "DEAL",
            label: "Deals"
        },
        {
            value: "CUSTOMER",
            label: "Customers"
        },
        {
            value: "CONTACT",
            label: "Contacts"
        }
    ]

    const DropdownIndicator = props => {
        return (
          <components.DropdownIndicator {...props}>
            <i style={{color: "black"}} className="ri-arrow-down-s-fill lh-24px"></i>
          </components.DropdownIndicator>
        );
    };

    const customSelectStyles = {
    control : (styles, state) => {
        
        return {...styles, backgroundColor: 'white', 
        borderRadius: '24px', height:'45px', 
        border: state.isFocused ? "1px solid var(--grey-300)" : "1px solid var(--grey-300)" , 
        boxShadow: state.isFocused ? 0 : 0,
        cursor: 'pointer',
        '&:hover': {
            border: state.isFocused ? "1px solid var(--grey-300)" : "1px solid var(--grey-300)"
        },
        padding: "0px 12px 8px 16px"}},

    valueContainer : styles => ({...styles, paddingRight: "0"}),
    dropdownIndicator : styles => ({...styles, padding: "0 4px"}),
    singleValue: styles => ({...styles, color: "var(--grey-700)", fontWeight: 500, fontSize: '24px'}),
    menuList: styles => ({...styles, fontSize: "16px", fontWeight: "500", color: "var(--grey-900)"}),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
            ...styles,
            backgroundColor: isFocused ? "var(--grey-50)" : isSelected ? "var(--grey-100)" : null,
            color: "var(--grey-900)"

        };
        }
    }

    const [selectedFormType, setSelectedFormType] = useState({
        value: "DEAL",
        label: "Deals"
    });  
    const [showAddField, setShowAddField] = useState(false);
    const [templateData, setTemplateData] = useState(null);
    const [submitNewField, setSubmitNewField ] = useState(false);
    const [submitEditField, setSubmitEditField ] = useState(false);
    const [loading, setLoading ] = useState(false);
    const [isFieldDefault, setIsFieldDefault ] = useState(false);
    const [editFieldData, setEditFieldData] = useState({fieldData: null, show: false});

    useEffect(()=>{
        setLoading(true);
        (async()=>{
            try{
                const templateData = await TemplateAPI.getTemplateByType(selectedFormType.value.toLowerCase())
                if(templateData.status === 200){
                    setTemplateData(templateData?.data?.data?.formFields)
                    setLoading(false)
                }else{
                    setLoading(false)
                    throw new Error("Unexpected Error Ocurred")
                }
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[selectedFormType])
  
  
    return (
        <div className='w-100 h-100'>
            {/* <h1>Team Page</h1> */}
            {/* <div className='d-flex grey-divider mt-16px'>
                <div onClick={()=>setActiveSection("Fields")} className={`px-24px py-8px cursor ${activeSection === 'Teams' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Form Fields</p>
                </div>
                <div onClick={()=>setActiveSection("Users")} className={`px-24px py-8px cursor ${activeSection === 'Users' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Stages</p>
                </div>
            </div> */}
       {!loading ? 
       <>
        <div className='max-w-47 m-auto d-flex-center flex-column pt-10px'> 
            <Select
                    value={selectedFormType}
                    onChange={(chosenOption)=>{
                        handleOptionClick(chosenOption)
                    }}
                    className="custom-form-select mb-20px"
                    classNamePrefix="select"
                    styles={customSelectStyles}
                    isSearchable={false}
                    components={{
                        DropdownIndicator,
                        IndicatorSeparator: () => null
                        }}
                    name="color"
                    placeholder="Select Sales Owner"
                    options={formTypes}
                />  
             
                <div className='w-100 h-max-content br-6px p-24px d-flex flex-column border-grey-300 mt-16px'>
                    <p className='color-grey-500 fs-14px fw-400'>
                    User can add/remove and edit form fields of particular entity. The changes will be displayed in appropriate entity creation fields
                    </p>
                    <p className='mt-8px fs-14px fw-500 color-grey-700 mb-16px'>General Fields</p>
                    {templateData && templateData?.length > 0 && templateData.filter(templateField => templateField.isDefault).length > 0 ? templateData.map(templateField => {
                      return templateField.isDefault ? <FieldsListItem setTemplateData={setTemplateData} props={templateField} formType={selectedFormType} setEditFieldData={setEditFieldData} editFieldData={editFieldData} /> : null;
                    }) : <p className='mb-20px color-grey-500'>Nothing to see yet</p>}
                   
                    <button onClick={()=> { 
                        setIsFieldDefault(true)
                        setShowAddField(true)}} className='secondary-btn w-100 x-16px py-10px d-flex-center gap-5px mt-4px'>
                        <i class="ri-add-line fs-20px lh-20px"></i> <p className=' fw-700 fs-14px color-grey-700'>Add Field</p>
                    </button>
                </div> 
                <div className='w-100 h-max-content br-6px p-24px d-flex flex-column border-grey-300 mt-16px'>
                    <p className='fs-14px fw-500 color-grey-700 mb-16px'>Additional Fields</p>
                    {templateData && templateData?.length > 0 && templateData.filter(templateField => !templateField.isDefault).length > 0 ? templateData.map(templateField => {
                      return !templateField.isDefault ? <FieldsListItem setTemplateData={setTemplateData} formType={selectedFormType} props={templateField} setEditFieldData={setEditFieldData} editFieldData={editFieldData} /> : null;
                    }) : <p className='mb-20px color-grey-500'>Nothing to see yet</p>}
                   
                    <button onClick={()=>{
                        setIsFieldDefault(false)
                        setShowAddField(true)}} className='secondary-btn w-100 x-16px py-10px d-flex-center gap-5px mt-4px'>
                        <i class="ri-add-line fs-20px lh-20px"></i> <p className=' fw-700 fs-14px color-grey-700'>Add Field</p>
                    </button>
                </div> 
        </div>


           {showAddField && 
           <SideModal 
           modalType={"NEW"}
           heading="Add Fields" onSubmit={()=>setSubmitNewField(true)} onClose={()=>setShowAddField(false)}>
                <CreateNewField isFieldDefault={isFieldDefault} setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitNewField} setSubmitForm={setSubmitNewField} onClose={()=>setShowAddField(false)}/>
            </SideModal>}
           {editFieldData.show && 
           <SideModal
           modalType={"EDIT"}
           heading="Edit Field" onSubmit={()=>setSubmitEditField(true)} onClose={()=>setEditFieldData({fieldData: null, show: false})}>
                <CreateNewField setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitEditField} setSubmitForm={setSubmitEditField} editFieldData={editFieldData} onClose={()=>setEditFieldData({fieldData: null, show: false})} />
            </SideModal>}

       </> : <Loader />}
          
        </div>
    );
}

const FieldsListItem = ({props, setEditFieldData, formType, setTemplateData}) => {
    const [activeItem, setActiveItem] = useState(false);

    const handleDelete = async () => {
        try{
            await TemplateAPI.deleteFormField(formType.value.toLowerCase(), props._id)
            const templateData = await TemplateAPI.getTemplateByType(formType.value.toLowerCase())
            if(templateData.status === 200){
                setTemplateData(templateData?.data?.data?.formFields);
            }
        }catch(err){
            console.error(err)
        }
    }

    return <div onMouseEnter={()=>setActiveItem(true)}
    onMouseLeave={()=>setActiveItem(false)}
    className='br-6px d-flex field-list-item justify-content-between align-items-center h-40px mb-12px'>
        <p className='color-grey-900 fs-16px '>{props.labelName}</p>
       {activeItem && <div className='d-flex gap-8px'>
        <div onClick={()=>handleDelete(props)} className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
        <i className="ri-delete-bin-5-line "></i>
        </div>
        <div className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
        <i onClick={()=>{
            setEditFieldData({fieldData: props, show: true})
        }} className="ri-pencil-line"></i>
        </div>
        </div>}
    </div>
}

export default Fields;