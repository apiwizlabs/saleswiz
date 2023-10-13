import React, { useEffect, useState } from 'react';
import Users from './Team-User/Users';
import Select, { components } from 'react-select'
import SideModal from '../../components/Modals/SideModal'
import CreateNewField from './CreateNewField';
import { TemplateAPI } from '../../api/apiConfig';
import { Loader } from "../../components/Loader";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from "uuid"

const Fields = () => {

    const [dragStart, setDragStart] = useState(1)
    const [dragItem, setDraggedItem] = useState(1)
    const [selectedFormType, setSelectedFormType] = useState({
        value: "DEAL",
        label: "Deals"
    });
    const [showAddField, setShowAddField] = useState(false);
    const [activeSection, setActiveSection] = useState("Fields")
    const [templateData, setTemplateData] = useState(null);
    const [stagesData, setStagesData] = useState([]);
    const [submitNewField, setSubmitNewField] = useState(false);
    const [submitEditField, setSubmitEditField] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFieldDefault, setIsFieldDefault] = useState(false);
    const [editFieldData, setEditFieldData] = useState({ fieldData: null, show: false });
    const [deleteStage, setDeleteStage] = useState({ label: null, show: false });

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
        },
        {
            value: "STAGE",
            label: "Stages"
        }
    ]

    const DropdownIndicator = props => {
        return (
            <components.DropdownIndicator {...props}>
                <i style={{ color: "black" }} className="ri-arrow-down-s-fill lh-24px"></i>
            </components.DropdownIndicator>
        );
    };

    const customSelectStyles = {
        control: (styles, state) => {

            return {
                ...styles, backgroundColor: 'white',
                borderRadius: '24px', height: '45px',
                border: state.isFocused ? "1px solid var(--grey-300)" : "1px solid var(--grey-300)",
                boxShadow: state.isFocused ? 0 : 0,
                cursor: 'pointer',
                '&:hover': {
                    border: state.isFocused ? "1px solid var(--grey-300)" : "1px solid var(--grey-300)"
                },
                padding: "0px 12px 8px 16px"
            }
        },

        valueContainer: styles => ({ ...styles, paddingRight: "0" }),
        dropdownIndicator: styles => ({ ...styles, padding: "0 4px" }),
        singleValue: styles => ({ ...styles, color: "var(--grey-700)", fontWeight: 500, fontSize: '24px' }),
        menuList: styles => ({ ...styles, fontSize: "16px", fontWeight: "500", color: "var(--grey-900)" }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            return {
                ...styles,
                backgroundColor: isFocused ? "var(--grey-50)" : isSelected ? "var(--grey-100)" : null,
                color: "var(--grey-900)"

            };
        }
    }


    const getStagesData = async () => {
        try {
            const templateData = await TemplateAPI.getTemplateByType("deal");
            if (templateData.status === 200) {
                // console.log(templateData, templateData?.data?.data?.formFields?.find(field => field?.labelName === "Select Stage")?.valueOptions, "TEMPLATE DATA");
                const stageLabels = templateData?.data?.data?.formFields?.find(field => field?.labelName === "Select Stage")?.valueOptions.map(item => {
                    const uId = uuidv4()
                    return {label: item, uId}
                })
                setStagesData({fieldId: templateData?.data?.data?.formFields?.find(field => field?.labelName === "Select Stage")?._id, stageLabels });
                setLoading(false);
            } else {
                setLoading(false);
                throw new Error("Unexpected Error Ocurred")
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
        }
    }

    const handleOptionClick = (option) => {
        if(option.value === "STAGE"){
            setActiveSection("Stages")
        }
        if(option.value !== "STAGE"){
            setActiveSection("Fields")
        }
        setSelectedFormType(option);
    };


    const handleDrop = async (result) => {
        console.log(result, "result");
        const stageList = Array.from(stagesData?.stageLabels)
        const [reorderedItem] = stageList.splice(result.source.index, 1);
        stageList.splice(result.destination.index, 0, reorderedItem)
        setStagesData(prev => ({...prev, stageLabels: stageList}));
        try{
            const tempData = await TemplateAPI.updateFormField("deal",{_id: stagesData?.fieldId, valueOptions: stageList, stageData: true});
            console.log(tempData, "resultant data")
        }catch(err){
            console.error(err)
        }
    }

    const random = async () => {
        try {
            const templateData = await TemplateAPI.getTemplateByType(selectedFormType.value.toLowerCase())
            if (templateData.status === 200) {
                console.log(templateData?.data?.data?.formFields, "response")
                setTemplateData(templateData?.data?.data?.formFields)
                setLoading(false)
            } else {
                setLoading(false)
                throw new Error("Unexpected Error Ocurred")
            }
        } catch (err) {
            setLoading(false)
            console.error(err)
        }
    }

    useEffect(() => {
        setLoading(true);
        if (selectedFormType?.value !== "STAGE") {
            random()
        } else {
            getStagesData()
        }

    }, [selectedFormType])

    console.log(templateData, "templateData");

    return (
        <div className='w-100 h-100'>
            {/* <h1>Team Page</h1> */}
            <div className='d-flex grey-divider mt-16px'>
                <div onClick={()=>{
                    setActiveSection("Fields")
                    setSelectedFormType({
                        value: "DEAL",
                        label: "Deals"
                    })
                    }} className={`px-24px py-8px cursor ${activeSection === 'Fields' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Form Fields</p>
                </div>
                <div onClick={()=>{
                    setActiveSection("Stages")
                    setSelectedFormType({
                        value: "STAGE",
                        label: "Stages"
                    })
                }} className={`px-24px py-8px cursor ${activeSection === 'Stages' ? 'active-border-bottom' : ''}`}>
                    <p className={`fs-14px color-grey-700`}>Stages</p>
                </div>
            </div>
            {!loading ?
                <>
                    <div className='max-w-47 m-auto d-flex-center flex-column pt-10px'>
                        <Select
                            value={selectedFormType}
                            onChange={(chosenOption) => {
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

                        <div className='w-100 h-max-content br-6px p-24px d-flex flex-column border-grey-300 mt-16px mb-16px'>
                            <p className='color-grey-500 fs-14px fw-400'>
                                User can add/remove and edit form fields of particular entity. The changes will be displayed in appropriate entity creation fields
                            </p>
                            <p className='mt-8px fs-14px fw-500 color-grey-700 mb-16px'>General Fields</p>
                            {selectedFormType?.value !== "STAGE" && templateData && templateData?.length > 0 && 
                            templateData.filter(templateField => templateField.isDefault).length > 0 ? templateData.map(templateField => {
                                if(selectedFormType?.value === "DEAL" && templateField.labelName === "Select Stage") return null
                                return  templateField.isDefault ? <FieldsListItem setTemplateData={setTemplateData} unitData={templateField} formType={selectedFormType} setEditFieldData={setEditFieldData} editFieldData={editFieldData} /> : null;
                            }) : selectedFormType?.value !== "STAGE" && <p className='mb-20px color-grey-500'>Nothing to see yet</p>}



                        {selectedFormType?.value === "STAGE" && stagesData?.stageLabels?.length > 0 ? 
                        <div>
                            <DragDropContext  
                                onDragEnd={handleDrop}
                                onDragStart={(draggedItem) => {
                                    console.log("idk 505")
                                    setDragStart(true)
                                    setDraggedItem(draggedItem);
                                    console.log("drag started, item: ", draggedItem);
                                }}
                                >
                                <Droppable droppableId={`123`}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {stagesData?.stageLabels?.map((stageData, i) =>
                                                <FieldsListItem 
                                                    stagesData={stagesData}
                                                    setDeleteStage={setDeleteStage}
                                                    unitData={stageData} 
                                                    formType={selectedFormType} 
                                                    setEditFieldData={setEditFieldData} 
                                                    editFieldData={editFieldData}  
                                                    mappedIndex={i}
                                                />
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable> 
                            </DragDropContext>
                        </div> 
                        : selectedFormType?.value === "STAGE" && <p className='mb-20px color-grey-500'>Nothing to see yet</p>
                        } 

                            <button onClick={() => {
                                setIsFieldDefault(true)
                                setShowAddField(true)
                            }} className='secondary-btn w-100 x-16px py-10px d-flex-center gap-5px mt-4px'>
                                <i class="ri-add-line fs-20px lh-20px"></i> 
                                <p className='fw-700 fs-14px color-grey-700'>Add Field</p>
                            </button>
                        </div>
                       {selectedFormType?.value !== "STAGE" && <div className='w-100 h-max-content br-6px p-24px d-flex flex-column border-grey-300'>
                            <p className='fs-14px fw-500 color-grey-700 mb-16px'>Additional Fields</p>
                            {templateData && templateData?.length > 0 && templateData.filter(templateField => !templateField.isDefault).length > 0 ? templateData.map(templateField => {
                                return !templateField.isDefault ? <FieldsListItem setTemplateData={setTemplateData} formType={selectedFormType} unitData={templateField} setEditFieldData={setEditFieldData} editFieldData={editFieldData} /> : null;
                            }) : <p className='mb-20px color-grey-500'>Nothing to see yet</p>}

                            <button onClick={() => {
                                setIsFieldDefault(false)
                                setShowAddField(true)
                            }} className='secondary-btn w-100 x-16px py-10px d-flex-center gap-5px mt-4px'>
                                <i class="ri-add-line fs-20px lh-20px"></i> <p className=' fw-700 fs-14px color-grey-700'>Add Field</p>
                            </button>
                        </div>}
                    </div>


                {deleteStage?.show && selectedFormType?.value === "STAGE" &&
                <SideModal 
                    heading={`Delete ${deleteStage?.label} Stage`} 
                    onSubmit={()=>setSubmitNewField(true)} 
                    onClose={()=>setDeleteStage({show: false, label: null})}>
                    <CreateNewField setStagesData={setStagesData} setTemplateData={setTemplateData} stagesData={stagesData} formType={selectedFormType} submitForm={submitNewField} deleteStage={deleteStage} setSubmitForm={setSubmitNewField} onClose={()=>setDeleteStage({show: false, label: null})}/>
                </SideModal>}

                {showAddField && selectedFormType?.value !== "STAGE" &&
                <SideModal 
                modalType={"NEW"}
                heading="Add Fields" onSubmit={()=>setSubmitNewField(true)} onClose={()=>setShowAddField(false)}>
                    <CreateNewField isFieldDefault={isFieldDefault} setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitNewField} setSubmitForm={setSubmitNewField} onClose={()=>setShowAddField(false)}/>
                </SideModal>}

                {showAddField && selectedFormType?.value === "STAGE" &&
                <SideModal modalType={"NEW"} heading="Add Stage" onSubmit={()=>setSubmitNewField(true)} onClose={()=>setShowAddField(false)}>
                    <CreateNewField setStagesData={setStagesData} stagesData={stagesData} isFieldDefault={isFieldDefault} setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitNewField} setSubmitForm={setSubmitNewField} onClose={()=>setShowAddField(false)}/>
                </SideModal>}

                {editFieldData.show && selectedFormType?.value !== "STAGE" &&
                <SideModal heading="Update Field" onSubmit={()=>setSubmitEditField(true)} onClose={()=>setEditFieldData({fieldData: null, show: false})}>
                    <CreateNewField setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitEditField} setSubmitForm={setSubmitEditField} editFieldData={editFieldData} onClose={()=>setEditFieldData({fieldData: null, show: false})} />
                </SideModal>}

                {editFieldData.show && selectedFormType?.value === "STAGE" &&
                <SideModal heading="Update Stage" onSubmit={()=>setSubmitEditField(true)} onClose={()=>setEditFieldData({fieldData: null, show: false})}>
                    <CreateNewField setStagesData={setStagesData} stagesData={stagesData} setTemplateData={setTemplateData} formType={selectedFormType} submitForm={submitEditField} setSubmitForm={setSubmitEditField} editFieldData={editFieldData} onClose={()=>setEditFieldData({fieldData: null, show: false})} />
                </SideModal>}

                </> : <Loader />}

        </div>
    );
}

const FieldsListItem = ({ unitData, setEditFieldData, formType, setTemplateData, mappedIndex, setDeleteStage }) => {
    const [activeItem, setActiveItem] = useState(false);
    const _id = uuidv4()

    const handleDelete = async () => {
        try {
            await TemplateAPI.deleteFormField(formType.value.toLowerCase(), unitData._id);

            const templateData = await TemplateAPI.getTemplateByType(formType.value.toLowerCase())
            if (templateData.status === 200) {
                setTemplateData(templateData?.data?.data?.formFields);
            }
        } catch (err) {
            console.error(err)
        }
    }
    const permanentStagesList =["Prospect", "Closed Won","Closed Lost"];

    return (
        <>
            {formType?.value === "STAGE" ?
                <Draggable key={unitData?.uId} draggableId={unitData?.uId} index={mappedIndex}>
                    {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        onMouseEnter={() => setActiveItem(true)}
                        onMouseLeave={() => setActiveItem(false)}
                        className='br-6px d-flex field-list-item justify-content-between align-items-center h-40px mb-12px'>
                        <div className='d-flex gap-8px'>
                            <i class="ri-draggable"></i>
                            <p className='color-grey-900 fs-16px '>{unitData?.label}</p>
                        </div>

                        {!permanentStagesList.includes(unitData?.label) && activeItem &&
                            <div className='d-flex gap-8px'>
                                <div onClick={()=>{
                                        setDeleteStage({show: true, label: unitData?.label })
                                    }} className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
                                    <i className="ri-delete-bin-5-line "></i>
                                </div>
                                <div className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
                                    <i onClick={() => {
                                        setEditFieldData({ fieldData: unitData, show: true, type: formType })
                                    }} className="ri-pencil-line"></i>
                                </div>
                            </div>
                        }

                    </div>
                    
                    )}
                 </Draggable> 
                :
                <div onMouseEnter={() => setActiveItem(true)}
                    onMouseLeave={() => setActiveItem(false)}
                    className='br-6px d-flex field-list-item justify-content-between align-items-center h-40px mb-12px'>
                    <div className='d-flex gap-8px'>
                        <p className='color-grey-900 fs-16px '>{unitData?.labelName}</p>
                    </div>

                    {activeItem &&
                        <div className='d-flex gap-8px'>
                            <div onClick={() => handleDelete(unitData)} className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
                                <i className="ri-delete-bin-5-line "></i>
                            </div>
                            <div className='d-flex-center w-28px h-28px p-4px icon-btn-grey cursor'>
                                <i onClick={() => {
                                    setEditFieldData({ fieldData: unitData, show: true })
                                }} className="ri-pencil-line"></i>
                            </div>
                        </div>
                    }

                </div>
            }

        </>
    )
}

export default Fields;
